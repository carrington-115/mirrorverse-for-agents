-- Hacktoberfest 2026: $5 of credits (500 cents, converted with centsToCredits
-- at redemption), one redemption per workspace, valid through October.
INSERT INTO promo_codes (code, value_cents, starts_at, expires_at, is_active)
VALUES ('HACKTOBERFEST-26', 500, '2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z', true)
ON CONFLICT (code) DO UPDATE SET
  value_cents = excluded.value_cents,
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  is_active = excluded.is_active;
