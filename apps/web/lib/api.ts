/**
 * API client wrapper for making HTTP requests to the backend API
 * Handles base URL configuration, error handling, and response parsing
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';
const LOCALE_STORAGE_KEY = 'smatway:locale';

export type ApiErrorResponse = {
  message?: string;
  statusCode?: number;
  error?: string;
};

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly response: ApiErrorResponse;

  constructor(message: string, statusCode: number, response: ApiErrorResponse = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export type ApiRequestInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * Make an API request with automatic error handling and response parsing
 * @param endpoint - The API endpoint path (e.g., '/users', '/auth/me')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws ApiError on request failure
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestInit = {},
): Promise<T> {
  const url = new URL(endpoint, API_BASE_URL).toString();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getStoredLocale(),
    ...options.headers,
  };

  // Add auth token if available (e.g., from cookies or localStorage)
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // A 401 from an auth endpoint is "bad credentials / bad reset token" —
      // NOT an expired session — so let it bubble up as a normal ApiError.
      const isAuthAttempt =
        endpoint.startsWith('/auth/login') ||
        endpoint.startsWith('/auth/register') ||
        endpoint.startsWith('/auth/verify-email') ||
        endpoint.startsWith('/auth/resend-otp') ||
        endpoint.startsWith('/auth/forgot-password') ||
        endpoint.startsWith('/auth/reset-password');

      // Token expired or invalid — wipe local auth and send to sign-in, but
      // ONLY if we are currently on a protected route (i.e. /dashboard or similar).
      // Public marketing pages also call APIs that return 401 when the visitor is
      // not logged in — we must NOT redirect those visitors to /signin.
      const isProtectedRoute =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/dashboard') ||
          window.location.pathname.startsWith('/admin'));

      if (response.status === 401 && !isAuthAttempt && isProtectedRoute) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_expires_at');
        localStorage.removeItem('auth_user');
        window.location.href = '/signin';
        // Throw anyway so callers awaiting this don't keep running.
        throw new ApiError('Session expired', 401, data);
      }

      throw new ApiError(
        data.message || `API Error: ${response.status}`,
        response.status,
        data,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      // Network error
      throw new ApiError('Network error: Failed to connect to API', 0, {
        message: error.message,
      });
    }

    throw new ApiError('Unknown error occurred', 0, {
      message: String(error),
    });
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(endpoint: string, options?: ApiRequestInit) {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestInit) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestInit) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestInit) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(endpoint: string, options?: ApiRequestInit) {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Get authentication token from storage
 * This is a placeholder implementation - adjust based on your auth strategy
 * (cookies, localStorage, sessionStorage, etc.)
 */
function getAuthToken(): string | null {
  // Try to get token from localStorage (client-side only)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'en';

  return localStorage.getItem(LOCALE_STORAGE_KEY) || document.documentElement.lang || 'en';
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};

// Profile API functions
import type {
  ProfileResponse,
  UserProfile,
  ProfileData,
  EmergencyContact,
  NotificationPreferences,
} from '@/types/profile.types';

export async function getProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('/users/profile');
}

export async function updateProfile(data: Partial<UserProfile & ProfileData>): Promise<any> {
  return apiPut<any>('/users/profile', data);
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL('/users/profile/upload-avatar', API_BASE_URL).toString();
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Accept-Language': getStoredLocale(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message || 'Failed to upload avatar', response.status, error);
  }

  return response.json();
}

export async function uploadBusinessCertificate(files: File[]): Promise<{ certificateUrls: string[] }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const url = new URL('/users/profile/upload-certificate', API_BASE_URL).toString();
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Accept-Language': getStoredLocale(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message || 'Failed to upload business certificates', response.status, error);
  }
  return response.json();
}

// Emergency contacts
export async function addEmergencyContact(data: {
  name: string;
  relation: string;
  phone: string;
}): Promise<EmergencyContact> {
  return apiPost<EmergencyContact>('/users/emergency-contacts', data);
}

export async function updateEmergencyContact(
  id: string,
  data: { name: string; relation: string; phone: string },
): Promise<EmergencyContact> {
  return apiPut<EmergencyContact>(`/users/emergency-contacts/${id}`, data);
}

export async function deleteEmergencyContact(id: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/users/emergency-contacts/${id}`);
}

// Notification preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>('/users/notification-preferences');
}

export async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiPut<NotificationPreferences>('/users/notification-preferences', data);
}

// Transport
export async function searchTransports(params: {
  departureCity?: string;
  departureCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  transportType?: string;
  date?: string;
}): Promise<any[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v && v !== 'All Types') query.set(k, v); });
  return apiGet<any[]>(`/transport?${query.toString()}`);
}

export async function getTransport(id: string): Promise<any> {
  return apiGet<any>(`/transport/${id}`);
}

export async function createTransport(data: {
  departureCountry: string;
  departureCity: string;
  departureAddress: string;
  destinationCountry: string;
  destinationCity: string;
  destinationAddress: string;
  price: number;
  currency?: string;
  availableSeats: number;
  departureDateTime: string;
  maxReachDateTime: string;
  vehicleId: string;
  stops?: { city: string; address: string }[];
  repeatDaily?: boolean;
  repeatDurationDays?: number;
}): Promise<any> {
  return apiPost<any>('/transport', data);
}

export async function getMyRoutes(): Promise<any[]> {
  return apiGet<any[]>('/transport/my');
}

export async function deleteTransport(id: string, reason?: string): Promise<any> {
  return apiRequest<any>(`/transport/${id}`, {
    method: 'DELETE',
    body: reason ? JSON.stringify({ reason }) : undefined,
  });
}

// Booking
export async function createBooking(data: {
  transportId: string;
  seatsBooked: number;
  paymentMethod?: string;
}): Promise<any> {
  return apiPost<any>('/booking', data);
}

export async function getMyBookings(): Promise<any[]> {
  return apiGet<any[]>('/booking/my');
}

export async function getBooking(id: string): Promise<any> {
  return apiGet<any>(`/booking/${id}`);
}

export async function cancelBooking(id: string): Promise<any> {
  return apiPatch<any>(`/booking/${id}/cancel`);
}

export async function updatePaymentMethod(id: string, paymentMethod: string): Promise<any> {
  return apiPatch<any>(`/booking/${id}/payment-method`, { paymentMethod });
}

export async function initializePayment(bookingId: string, callbackUrl?: string): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const finalCallbackUrl = callbackUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : undefined);
  return apiPost<any>('/payment/initialize', { bookingId, callbackUrl: finalCallbackUrl });
}

export async function getConversionPreview(amount: number, currency: string, gateway: string): Promise<{
  requiresConversion: boolean;
  originalCurrency: string;
  originalAmount: number;
  paymentCurrency: string;
  paymentAmount: number;
  exchangeRate: number;
}> {
  return apiGet<any>(`/payment/conversion-preview?amount=${amount}&currency=${currency}&gateway=${gateway}`);
}

export async function verifyPayment(reference: string): Promise<{ success: boolean; status: string; bookingId?: string }> {
  return apiGet<any>(`/payment/verify/${reference}`);
}

export async function getTransportBookings(transportId?: string): Promise<any[]> {
  if (transportId) {
    return apiGet<any[]>(`/booking/transport/${transportId}`);
  }
  return apiGet<any[]>(`/booking/transporter/all`);
}

export async function confirmBooking(id: string): Promise<any> {
  return apiPatch<any>(`/booking/${id}/confirm`);
}

export async function rejectBooking(id: string): Promise<any> {
  return apiPatch<any>(`/booking/${id}/reject`);
}

export async function completeBooking(id: string): Promise<any> {
  return apiPatch<any>(`/booking/${id}/complete`);
}

export async function createReview(bookingId: string, rating: number, feedback?: string): Promise<any> {
  return apiPost<any>(`/review`, { bookingId, rating, feedback });
}

export async function getTransporterStats(transporterId: string): Promise<any> {
  return apiGet<any>(`/review/transporter/${transporterId}/stats`);
}

export async function getTransporterReviews(transporterId: string, page: number = 1, limit: number = 5): Promise<any> {
  return apiGet<any>(`/review/transporter/${transporterId}/reviews?page=${page}&limit=${limit}`);
}

export async function getTransporterProfile(transporterId: string): Promise<any> {
  return apiGet<any>(`/review/transporter/${transporterId}/profile`);
}

/** Latest reviews across the platform — used by the marketing Testimonials section. */
export async function getRecentReviews(limit: number = 6): Promise<{ reviews: any[] }> {
  return apiGet<{ reviews: any[] }>(`/review/recent?limit=${limit}`);
}

/**
 * Public platform overview — real, live aggregate counts plus latest reviews.
 * Used by the auth left panel so we never display fabricated numbers.
 */
export type PlatformOverview = {
  stats: {
    travelers: number;
    transporters: number;
    activeRoutes: number;
    completedTrips: number;
    reviews: number;
    avgRating: number | null;
    onTimeRate: number | null;
  };
  recentReviews: Array<{
    id: string;
    rating: number;
    feedback: string | null;
    createdAt: string;
    traveler: { name: string | null; country: string | null } | null;
    transporter: { name: string | null } | null;
  }>;
};

export async function getPlatformOverview(reviewLimit: number = 4): Promise<PlatformOverview> {
  return apiGet<PlatformOverview>(`/platform/overview?reviewLimit=${reviewLimit}`);
}

// ─── Popular routes (public, marketing homepage bento) ────────────────────────
export type PopularRoute = {
  from: string;
  to: string;
  fromCountry: string;
  toCountry: string;
  bookings: number;
  minPrice: number;
  currency: string;
  vehicle: string;
  availableSeats: number;
  nextDepartureMinutes: number | null;
};

export async function getPopularRoutes(limit: number = 4): Promise<{ routes: PopularRoute[] }> {
  return apiGet<{ routes: PopularRoute[] }>(`/platform/popular-routes?limit=${limit}`);
}

// ─── Site feedback (about SmatWay itself, surfaced on homepage) ──────────────
export type SiteFeedbackUser = {
  id: string;
  name: string | null;
  country: string | null;
  accountType: "TRAVELER" | "TRANSPORTER" | null;
  avatarUrl: string | null;
};

export type SiteFeedbackEntry = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: SiteFeedbackUser | null;
};

export type SiteFeedbackStats = {
  count: number;
  avgRating: number | null;
  distribution: number[]; // [1★pct, 2★pct, 3★pct, 4★pct, 5★pct]
  recommendRate: number | null;
};

export async function createSiteFeedback(data: { rating: number; comment: string; bookingId?: string }): Promise<{
  id: string; rating: number; comment: string; createdAt: string; bookingId?: string | null;
}> {
  return apiPost('/feedback', data);
}

export async function getMySiteFeedback(): Promise<{ feedback: SiteFeedbackEntry[] }> {
  return apiGet('/feedback/mine');
}

export async function getRecentSiteFeedback(limit: number = 6): Promise<{ feedback: SiteFeedbackEntry[] }> {
  return apiGet(`/feedback/recent?limit=${limit}`);
}

export async function getSiteFeedbackStats(): Promise<SiteFeedbackStats> {
  return apiGet('/feedback/stats');
}

// Vehicle
export async function createVehicle(data: {
  name: string;
  model: string;
  plateNumber: string;
  transportType: string;
  features?: string[];
  images?: File[];
}): Promise<any> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('model', data.model);
  formData.append('plateNumber', data.plateNumber);
  formData.append('transportType', data.transportType);
  if (data.features && data.features.length > 0) {
    formData.append('features', JSON.stringify(data.features));
  }
  if (data.images && data.images.length > 0) {
    data.images.forEach((img) => {
      formData.append('images', img);
    });
  }

  const url = new URL('/vehicle', API_BASE_URL).toString();
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Accept-Language': getStoredLocale(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message || 'Failed to create vehicle', response.status, error);
  }

  return response.json();
}

export async function getMyVehicles(): Promise<any[]> {
  return apiGet<any[]>('/vehicle/my');
}

export async function getVehicle(id: string): Promise<any> {
  return apiGet<any>(`/vehicle/${id}`);
}

export async function updateVehicle(id: string, data: FormData): Promise<any> {
  const url = new URL(`/vehicle/${id}`, process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002').toString();
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept-Language': getStoredLocale(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: data,
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new ApiError(
      resData.message || `API Error: ${response.status}`,
      response.status,
      resData,
    );
  }
  return resData;
}

export async function deleteVehicle(id: string, reason?: string): Promise<any> {
  return apiRequest<any>(`/vehicle/${id}`, {
    method: 'DELETE',
    body: reason ? JSON.stringify({ reason }) : undefined,
  });
}

// Password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>('/users/change-password', data);
}

export async function verifyPassword(password: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/auth/verify-password', { password });
}

export async function disableRoutesByVehicle(vehicleId: string): Promise<any> {
  return apiDelete<any>(`/transport/vehicle/${vehicleId}`);
}

// Chat
export async function initChat(bookingId: string): Promise<any> {
  return apiPost<any>(`/chat/booking/${bookingId}`, {});
}

export async function getChatByBooking(bookingId: string): Promise<any> {
  return apiGet<any>(`/chat/booking/${bookingId}`);
}

export async function getMessages(chatId: string): Promise<any[]> {
  return apiGet<any[]>(`/chat/${chatId}/messages`);
}

export async function sendMessage(chatId: string, content: string): Promise<any> {
  return apiPost<any>(`/chat/${chatId}/messages`, { content });
}

// Excess Luggage
export async function initializeExcessLuggagePayment(excessLuggageId: string, callbackUrl?: string, gateway?: string): Promise<{ authorization_url: string; reference: string }> {
  return apiPost<{ authorization_url: string; reference: string }>('/payment/initialize-excess-luggage', { excessLuggageId, callbackUrl, gateway });
}

export async function verifyExcessLuggagePayment(reference: string): Promise<{ success: boolean; status: string }> {
  return apiGet<{ success: boolean; status: string }>(`/payment/verify-excess-luggage/${reference}`);
}

export async function getExcessLuggageCharge(id: string): Promise<any> {
  return apiGet<any>(`/excess-luggage/charge/${id}`);
}

// Announcements API functions
export async function getTransporterAnnouncements(): Promise<any[]> {
  return apiGet<any[]>('/announcements/transporter');
}

export async function getTravelerAnnouncements(): Promise<any[]> {
  return apiGet<any[]>('/announcements/traveler');
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  transportId?: string;
}): Promise<any> {
  return apiPost<any>('/announcements', data);
}

export async function deleteAnnouncement(id: string): Promise<any> {
  return apiDelete<any>(`/announcements/${id}`);
}
