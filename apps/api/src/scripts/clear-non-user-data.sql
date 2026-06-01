-- Delete all non-user data in dependency order
-- (deepest dependents first to avoid FK constraint violations)

DELETE FROM "Message";
DELETE FROM "Chat";
DELETE FROM "Review";
DELETE FROM "SiteFeedback";
DELETE FROM "Announcement";
DELETE FROM "Booking";
DELETE FROM "RouteStop";
DELETE FROM "Transport";
DELETE FROM "Vehicle";

-- Confirm counts
SELECT 'Message'     AS table_name, COUNT(*) FROM "Message"
UNION ALL
SELECT 'Chat',                       COUNT(*) FROM "Chat"
UNION ALL
SELECT 'Review',                     COUNT(*) FROM "Review"
UNION ALL
SELECT 'SiteFeedback',               COUNT(*) FROM "SiteFeedback"
UNION ALL
SELECT 'Announcement',               COUNT(*) FROM "Announcement"
UNION ALL
SELECT 'Booking',                    COUNT(*) FROM "Booking"
UNION ALL
SELECT 'RouteStop',                  COUNT(*) FROM "RouteStop"
UNION ALL
SELECT 'Transport',                  COUNT(*) FROM "Transport"
UNION ALL
SELECT 'Vehicle',                    COUNT(*) FROM "Vehicle"
UNION ALL
SELECT 'User (preserved)',           COUNT(*) FROM "User";
