export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  country: string | null;
  preferredCurrency?: string | null;
  avatarUrl: string | null;
  accountType: 'TRAVELER' | 'TRANSPORTER' | null;
  role: string;
}

export interface ProfileData {
  bio?: string;
  dateOfBirth?: string;
  travelerBio?: string;
  companyName?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  vehicleType?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  verified: boolean;
}

export interface NotificationPreferences {
  id: string;
  pushEnabled: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  routeUpdates: boolean;
  vehicleUpdates: boolean;
  systemAnnouncements: boolean;
}

export interface ProfileResponse {
  user: UserProfile;
  profile: ProfileData | null;
  emergencyContacts: EmergencyContact[];
  notificationPreferences: NotificationPreferences | null;
}
