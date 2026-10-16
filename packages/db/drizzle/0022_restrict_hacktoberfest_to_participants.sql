-- HACKTOBERFEST-26 is for registered event participants only. Their emails are
-- loaded into promo_code_allowed_emails with scripts/import-promo-allowlist.mjs
-- (the participant list is personal data and is not committed to this repo).
UPDATE promo_codes SET restrict_to_allowlist = true WHERE code = 'HACKTOBERFEST-26';
