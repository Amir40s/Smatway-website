-- User.preferredCurrency (ISO 4217 code) — nullable, user's default for new routes / display
ALTER TABLE "User" ADD COLUMN "preferredCurrency" TEXT;

-- Transport.currency — currency the `price` is denominated in. Defaults to USD for existing rows.
ALTER TABLE "Transport" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
