# Transporter Ratings & Profile System - Phase 1 Design Spec

**Goal:** Implement a 5-star rating system and transporter profile image requirement to build trust and enable travelers to evaluate transporters before booking.

**Architecture:** Backend adds Review model and completes booking workflow. Frontend adds transporter profile modal, rating submission form, and route card enhancements.

**Tech Stack:** Prisma (database), NestJS (API), Next.js (frontend), Garage/MinIO (profile image storage)

---

## 1. Database Schema

### New Models & Enums

#### BookingStatus Enum
Add `COMPLETED` status to track finished rides:
```
enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED    // New: ride finished, eligible for rating
}
```

#### Review Model
Store traveler feedback on transporters:
```prisma
model Review {
  id            String    @id @default(uuid())
  bookingId     String    @unique
  booking       Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  travelerId    String
  traveler      User      @relation("TravelerReviews", fields: [travelerId], references: [id], onDelete: Cascade)
  
  transporterId String
  transporter   User      @relation("TransporterReviews", fields: [transporterId], references: [id], onDelete: Cascade)
  
  rating        Int       // 1-5 stars
  feedback      String?   // Optional text feedback (max 500 chars)
  
  createdAt     DateTime  @default(now())
  
  @@index([transporterId])
  @@index([travelerId])
}
```

#### User Model Changes
Add profile image and rating fields (calculated on-the-fly, not stored):
```prisma
model User {
  // ... existing fields ...
  profileImageUrl  String?   // For transporters - required before route creation
  
  // Relations
  reviewsGiven     Review[]  @relation("TravelerReviews")
  reviewsReceived  Review[]  @relation("TransporterReviews")
}
```

#### Booking Model Changes
Update relation to include reviews:
```prisma
model Booking {
  // ... existing fields ...
  review        Review?   // One-to-one with Review
}
```

---

## 2. API Endpoints

### Booking Management

**POST /booking/:id/complete**
- Mark a booking as COMPLETED
- Only transporter who owns the transport can call this
- Returns updated booking with status: COMPLETED
- Triggers eligibility for traveler to rate

**GET /booking/:id/rating-eligible**
- Check if a booking can be rated (status === COMPLETED)
- Called before showing "Rate this trip" prompt

### Rating/Review

**POST /review**
- Create a rating and feedback after booking is COMPLETED
- Request body: `{ bookingId: string, rating: 1-5, feedback?: string }`
- Only traveler who booked can submit (validated against travelerId)
- Returns: created review object
- Error: 400 if booking not COMPLETED, 409 if review already exists

**GET /transporter/:transporterId/stats**
- Returns transporter statistics for route card badge
- Response: `{ averageRating: number, totalCompletedRides: number }`
- Calculated: average of all Review.rating values, count of COMPLETED bookings

**GET /transporter/:transporterId/reviews**
- Returns paginated reviews for transporter profile
- Query params: `?page=1&limit=5`
- Response: array of reviews with traveler name (not avatar URL for privacy)
- Ordered by most recent first

**GET /transporter/:transporterId/full-profile**
- Returns complete transporter info for profile modal
- Response includes:
  - User: id, name, phoneNumber, profileImageUrl (presigned URL), createdAt
  - Stats: averageRating, totalCompletedRides, vehicleCount
  - Reviews: paginated list (first 5)

### Profile Image

**PATCH /profile/image**
- Upload transporter profile image
- Multipart form-data with file
- Returns: presigned URL for stored image, updates User.profileImageUrl
- Validation: transporters only, required before creating routes
- Storage: `transporters/{userId}/profile-{uuid}.{ext}` in Garage

---

## 3. Service Logic

### BookingService

**complete(bookingId: string, transporterId: string)**
- Validate booking exists and transporter owns it
- Update booking.status = COMPLETED
- Return updated booking
- Error: ForbiddenException if transporter doesn't own transport

### ReviewService (New)

**createReview(bookingId: string, travelerId: string, rating: number, feedback?: string)**
- Validate booking exists and is COMPLETED
- Validate travelerId matches booking.travelerId
- Check review doesn't already exist for this booking
- Create and return review
- Errors: BadRequestException if booking not COMPLETED or review exists, ForbiddenException if traveler doesn't own booking

**getTransporterStats(transporterId: string)**
- Query all COMPLETED bookings for transporter
- Query all reviews for transporter
- Calculate average rating (round to 1 decimal)
- Count total completed rides
- Return { averageRating, totalCompletedRides }
- Performance: cache for 1 hour (stats don't need real-time updates)

**getTransporterReviews(transporterId: string, page: number = 1, limit: number = 5)**
- Query reviews paginated, ordered by createdAt DESC
- Join with Booking and Traveler to get names
- Return reviews without traveler photos (privacy)
- Pagination: offset = (page - 1) * limit

**getTransporterFullProfile(transporterId: string)**
- Fetch user, stats, reviews, vehicle count in one call
- Generate presigned URL for profileImageUrl if exists
- Return combined object for modal/profile page

### VehicleService & TransportService

**myRoutes() enhancement**
- Include transporter stats (averageRating, totalCompletedRides) in response
- Shown as badge on route cards

---

## 4. Frontend Components & Pages

### Route Card Enhancement
File: `apps/web/app/dashboard/(travelor)/page.tsx` (search results)

Add to transporter info section:
```
<div className="flex items-center gap-2">
  <button 
    onClick={() => openTransporterProfile(booking.transport.transporterId)}
    className="hover:opacity-80"
  >
    <Avatar src={transporter.profileImageUrl} fallback={initials} />
  </button>
  <div>
    <p className="font-medium">{transporter.name}</p>
    <p className="text-sm text-slate-500">⭐ {stats.averageRating} ({stats.totalCompletedRides} rides)</p>
  </div>
</div>
```

### Transporter Profile Modal
File: `apps/web/app/dashboard/(travelor)/transporter-profile/[id]/page.tsx` (new)

Layout:
1. **Header** - Profile photo (large), name, phone, member since
2. **Stats Row** - Stars (large), completed rides count, vehicle count
3. **Reviews Section** - List of feedback with pagination
4. **Close button**

Styling: Match existing modal/card design, rounded corners, white background

### Booking Completion Flow
File: `apps/web/app/dashboard/(travelor)/booking-complete/[id]/page.tsx` (new route after transporter marks complete)

Show after `POST /booking/:id/complete`:
1. Confirmation: "Trip complete! How was your ride?"
2. Star picker (1-5 interactive stars)
3. Text feedback input (optional, max 500 chars, counter)
4. Submit button
5. On success: "Thank you for rating!" + close/navigate back

### Transporter Onboarding - Profile Image
File: `apps/api/src/modules/auth/registration.flow.ts` (update transporter registration)

Flow:
1. Email + password
2. Account type selection (Traveler vs Transporter)
3. **Profile photo upload (for Transporter only)**
   - Show upload modal
   - Required to proceed (disable Next button if empty)
   - On success, store presigned URL and continue
4. Basic info (name, phone, country)
5. Done

---

## 5. Data Flow

### Rating a Trip
1. Transporter marks booking COMPLETED → calls `POST /booking/:id/complete`
2. Frontend detects completion, shows "Rate this trip" prompt
3. Traveler fills star rating + feedback
4. Submit → `POST /review` with bookingId, rating, feedback
5. Review created and stored
6. Frontend shows confirmation

### Viewing Transporter Profile
1. Traveler clicks transporter avatar on route card
2. Frontend calls `GET /transporter/{id}/full-profile`
3. Modal opens with:
   - Profile image (presigned URL from response)
   - Stats (averageRating, totalCompletedRides, vehicleCount)
   - Reviews paginated list

### Finding Routes with Ratings
1. Traveler searches routes → `GET /transport/search`
2. Response includes transporter info + stats (averageRating, totalCompletedRides)
3. Route cards display badge: ⭐ 4.5 (12 rides)
4. Traveler can click to see full profile

---

## 6. Error Handling

| Scenario | Error | HTTP | Message |
|----------|-------|------|---------|
| Complete non-existent booking | NotFoundException | 404 | Booking not found |
| Complete booking you don't own | ForbiddenException | 403 | Not authorized |
| Rate non-completed booking | BadRequestException | 400 | Booking must be completed |
| Rate twice | BadRequestException | 400 | Review already exists |
| Transporter access without image | ForbiddenException | 403 | Profile image required |

---

## 7. Backward Compatibility

- Existing CONFIRMED bookings remain valid, don't auto-complete
- Rating system is purely additive (existing data unchanged)
- Transporter profile image is optional for existing users (only required on new sign-ups)
- Calculate stats on-the-fly for users without existing reviews (default: 0 rating, 0 rides)

---

## 8. Testing Strategy

### API Tests
- `POST /booking/:id/complete` - success, forbidden, not-found
- `POST /review` - success, bad status, duplicate, unauthorized
- `GET /transporter/:id/stats` - returns correct averages and counts
- `GET /transporter/:id/reviews` - pagination, ordering

### Frontend Tests
- Rating form submits correct payload
- Profile modal displays stats and reviews
- Route cards show badges
- Onboarding blocks transporter until image uploaded

---

## 9. Performance Considerations

- **Stats Caching** - Cache `getTransporterStats()` for 1 hour (ratings change infrequently)
- **Presigned URLs** - Generate on-demand, expires in 7 days
- **Review Pagination** - Load 5 reviews per page, lazy-load more
- **Database Indexes** - Add indexes on Review.transporterId and Review.travelerId for fast lookups

---

## 10. Future Enhancements (Phase 2+)

- Transporter can respond to reviews
- Filters: sort routes by rating, hide low-rated transporters
- Chat system (Phase 2)
- Call integration (Phase 2)
- Dispute resolution for ratings
