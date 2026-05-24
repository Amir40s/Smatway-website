# Profile & Settings Backend Integration

**Date:** 2026-04-21  
**Scope:** Integrate profile and settings pages with backend API and database. Two user types (Traveler/Transporter) with role-specific fields.

## Overview

Currently profile and settings pages use hardcoded mock data. This spec defines the complete backend integration:
- Database schema for user profiles, emergency contacts, and notification preferences
- REST API endpoints for CRUD operations
- Frontend form submission flow with file upload to Garage (MinIO)
- Validation and error handling

## Database Schema

### UserProfile Model
Extends user information with profile-specific fields, supporting both Traveler and Transporter account types.

**Fields:**
- `id` (UUID, PK)
- `userId` (UUID, FK to User, unique)
- `bio` (optional) - shared bio
- `avatarUrl` (optional) - URL to avatar stored in Garage
- `dateOfBirth` (optional) - traveler/transporter shared
- `travelerBio` (optional) - traveler-specific bio/description
- `emergencyContactName` (optional) - traveler reference
- `emergencyContactPhone` (optional) - traveler reference
- `companyName` (optional) - transporter company name
- `licenseNumber` (optional) - transporter license
- `licenseExpiry` (optional) - transporter license expiration
- `vehicleType` (optional) - transporter vehicle type
- `createdAt`, `updatedAt` - timestamps

**Relations:**
- 1:1 to User (onDelete: Cascade)
- 1:N to EmergencyContact
- 1:1 to NotificationPreferences

### EmergencyContact Model
Stores emergency contact information for users (typically travelers).

**Fields:**
- `id` (UUID, PK)
- `profileId` (UUID, FK to UserProfile)
- `name` (string, required)
- `relation` (string) - "family", "friend", etc.
- `phone` (string, required)
- `verified` (boolean, default: false)
- `createdAt`, `updatedAt`

### NotificationPreferences Model
Structured notification settings, separate from User for scalability.

**Fields:**
- `id` (UUID, PK)
- `profileId` (UUID, FK to UserProfile, unique)
- `pushEnabled` (boolean, default: true)
- `bookingUpdates` (boolean, default: true)
- `paymentUpdates` (boolean, default: true)
- `routeUpdates` (boolean, default: true)
- `vehicleUpdates` (boolean, default: true)
- `systemAnnouncements` (boolean, default: true)
- `createdAt`, `updatedAt`

### User Model Update
Add `avatarUrl` field to User for quick access without joining UserProfile.

## API Endpoints

### Profile Endpoints

#### GET /users/profile
Retrieve complete profile for authenticated user.

**Auth:** JwtAuthGuard required  
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "country": "US",
    "avatarUrl": "https://garage.local/bucket/avatar.jpg",
    "accountType": "TRAVELER|TRANSPORTER",
    "role": "USER"
  },
  "profile": {
    "bio": "...",
    "dateOfBirth": "1990-01-01",
    "travelerBio": "...",
    "companyName": "...",
    "vehicleType": "..."
  },
  "emergencyContacts": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "relation": "family",
      "phone": "+1234567890",
      "verified": true
    }
  ],
  "notificationPreferences": {
    "pushEnabled": true,
    "bookingUpdates": true,
    "paymentUpdates": true,
    "routeUpdates": true,
    "vehicleUpdates": true,
    "systemAnnouncements": true
  }
}
```

#### PUT /users/profile
Update user profile information.

**Auth:** JwtAuthGuard required  
**Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "country": "US",
  "bio": "I love traveling",
  "dateOfBirth": "1990-01-01",
  "avatarUrl": "https://garage.local/bucket/avatar.jpg",
  "travelerBio": "Budget traveler",
  "companyName": "My Transport Co",
  "licenseNumber": "LIC123",
  "licenseExpiry": "2026-12-31",
  "vehicleType": "Van"
}
```
**Validation:**
- `name`: required, max 100 chars
- `phoneNumber`: valid phone format
- `country`: valid ISO country code
- `dateOfBirth`: valid date, age >= 18
- `avatarUrl`: valid URL starting with garage domain

**Response:** Updated UserProfile with User data

#### POST /users/profile/upload-avatar
Upload avatar image to Garage and return URL.

**Auth:** JwtAuthGuard required  
**Body:** multipart/form-data with file (max 5MB, jpg/png)  
**Response:**
```json
{
  "avatarUrl": "https://garage.local/bucket/avatar-uuid.jpg"
}
```
**Note:** Client receives URL and includes in next PUT /users/profile call.

### Emergency Contacts Endpoints

#### POST /users/emergency-contacts
Create emergency contact.

**Auth:** JwtAuthGuard required  
**Body:**
```json
{
  "name": "Jane Doe",
  "relation": "family",
  "phone": "+1234567890"
}
```
**Validation:**
- `name`: required, max 100 chars
- `relation`: required, valid enum (family, friend, other)
- `phone`: required, valid format

**Response:** Created EmergencyContact

#### PUT /users/emergency-contacts/:id
Update emergency contact.

**Auth:** JwtAuthGuard required  
**Body:** Same as POST  
**Response:** Updated EmergencyContact

#### DELETE /users/emergency-contacts/:id
Delete emergency contact.

**Auth:** JwtAuthGuard required  
**Response:**
```json
{
  "ok": true
}
```

### Settings Endpoints

#### GET /users/notification-preferences
Retrieve notification settings.

**Auth:** JwtAuthGuard required  
**Response:** NotificationPreferences object

#### PUT /users/notification-preferences
Update notification settings.

**Auth:** JwtAuthGuard required  
**Body:**
```json
{
  "pushEnabled": true,
  "bookingUpdates": true,
  "paymentUpdates": true,
  "routeUpdates": true,
  "vehicleUpdates": true,
  "systemAnnouncements": true
}
```
**Response:** Updated NotificationPreferences

#### PUT /users/change-password
Change user password.

**Auth:** JwtAuthGuard required  
**Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
**Validation:**
- `currentPassword`: must match user's current password hash
- `newPassword`: required, min 8 chars, not same as current
- `confirmPassword`: must match newPassword

**Response:**
```json
{
  "ok": true
}
```

## Frontend Integration

### Profile Page Flow
1. **Mount:** GET /users/profile → populate form with current data
2. **Edit fields:** Update local React state (name, phone, country, bio, etc.)
3. **Avatar upload:**
   - User clicks camera button
   - File input triggered
   - POST /users/profile/upload-avatar with file
   - Receive avatarUrl, store in local state
   - Show preview image immediately
4. **Submit:** Click "Update Profile" button
   - PUT /users/profile with all fields (including avatarUrl)
   - Show success/error toast
   - Refresh profile data
5. **Emergency Contacts:**
   - Display list from profile
   - Add: Form + POST /users/emergency-contacts
   - Edit: Form + PUT /users/emergency-contacts/:id
   - Delete: Confirmation + DELETE /users/emergency-contacts/:id

### Settings Page Flow
1. **Mount:** GET /users/notification-preferences → populate toggles
2. **Edit notifications:** Update local state on toggle change
3. **Change password:**
   - Collect current password, new password, confirm
   - PUT /users/change-password
   - Clear form, show success toast, or show error
4. **Submit notifications:** Click button → PUT /users/notification-preferences

### API Client Updates
**apps/web/lib/api.ts:**
- `getProfile()` - GET /users/profile
- `updateProfile(data)` - PUT /users/profile
- `uploadAvatar(file)` - POST /users/profile/upload-avatar
- `addEmergencyContact(data)` - POST /users/emergency-contacts
- `updateEmergencyContact(id, data)` - PUT /users/emergency-contacts/:id
- `deleteEmergencyContact(id)` - DELETE /users/emergency-contacts/:id
- `getNotificationPreferences()` - GET /users/notification-preferences
- `updateNotificationPreferences(data)` - PUT /users/notification-preferences
- `changePassword(data)` - PUT /users/change-password

**apps/web/lib/auth.ts:**
- Cache profile data after login
- Refresh on profile updates

### File Upload to Garage
**Configuration:**
- Garage endpoint: http://localhost:9000 (from docker-compose.infra.yml)
- Bucket: `smatway` (or configurable via env)
- Access Key/Secret: From .env

**Backend Implementation:**
- Use AWS SDK with s3ForcePathStyle: true
- Generate UUID-based filenames: `avatars/{userId}-{uuid}.jpg`
- Return public URL with garage domain
- Implement file size/type validation on server

## Error Handling

**Profile endpoint errors:**
- 400: Validation error (invalid phone, age < 18, etc.)
- 401: Not authenticated
- 404: User not found
- 500: Server error

**File upload errors:**
- 400: File too large, invalid type
- 413: Payload too large
- 500: Garage unavailable

**Password change errors:**
- 400: Current password incorrect, passwords don't match
- 401: Not authenticated

**Frontend handling:**
- Show error toast with user-friendly message
- Preserve form state on error
- Log errors to monitoring

## Testing Strategy

**Unit Tests:**
- Profile DTO validation
- Password validation logic
- File validation (size, type)

**Integration Tests:**
- Create UserProfile on User registration
- Update profile fields
- Upload avatar to Garage
- CRUD emergency contacts
- Update notification preferences
- Change password flow

**End-to-End Tests:**
- Load profile page → form populated
- Edit + submit → data persisted
- Upload avatar → preview + stored in Garage
- Add emergency contact → appears in list
- Toggle notifications → persisted

## Deployment Notes

- Garage must be running before profile uploads work
- Prisma migrations must be applied before API endpoints work
- Environment variables: Garage endpoint, bucket name, credentials
- Update API documentation after endpoints are deployed

## Rollout Plan

1. Create Prisma migrations (schema)
2. Implement API endpoints (controller, service)
3. Wire up frontend (API client, forms)
4. Integration testing
5. Deploy to staging
6. Deploy to production

**Estimated effort:** 2-3 days for one developer
