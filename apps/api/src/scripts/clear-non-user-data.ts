/**
 * clear-non-user-data.ts
 *
 * Deletes ALL data from the database EXCEPT:
 *   User, AuthProvider, RefreshToken, PasswordResetToken,
 *   EmailVerificationOtp, UserProfile, EmergencyContact,
 *   NotificationPreferences
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/scripts/clear-non-user-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Starting data wipe (users will be preserved)...\n');

  // ─── 1. Deepest dependents first ───────────────────────────────────────────

  const messages = await prisma.message.deleteMany();
  console.log(`🗑  Messages deleted:      ${messages.count}`);

  const chats = await prisma.chat.deleteMany();
  console.log(`🗑  Chats deleted:         ${chats.count}`);

  const reviews = await prisma.review.deleteMany();
  console.log(`🗑  Reviews deleted:       ${reviews.count}`);

  const feedback = await prisma.siteFeedback.deleteMany();
  console.log(`🗑  Site Feedback deleted: ${feedback.count}`);

  const announcements = await prisma.announcement.deleteMany();
  console.log(`🗑  Announcements deleted: ${announcements.count}`);

  // ─── 2. Bookings (depends on Transport & User) ─────────────────────────────

  const bookings = await prisma.booking.deleteMany();
  console.log(`🗑  Bookings deleted:      ${bookings.count}`);

  // ─── 3. Route stops (depends on Transport) ─────────────────────────────────

  const stops = await prisma.routeStop.deleteMany();
  console.log(`🗑  Route Stops deleted:   ${stops.count}`);

  // ─── 4. Transports (depends on Vehicle & User) ─────────────────────────────

  const transports = await prisma.transport.deleteMany();
  console.log(`🗑  Transports deleted:    ${transports.count}`);

  // ─── 5. Vehicles (depends on User) ─────────────────────────────────────────

  const vehicles = await prisma.vehicle.deleteMany();
  console.log(`🗑  Vehicles deleted:      ${vehicles.count}`);

  // ─── Done ───────────────────────────────────────────────────────────────────
  console.log('\n✅  Done. All non-user data has been wiped.');
  console.log('✅  Users, profiles, and auth tokens are intact.');
}

main()
  .catch((e) => {
    console.error('\n❌  Error during wipe:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
