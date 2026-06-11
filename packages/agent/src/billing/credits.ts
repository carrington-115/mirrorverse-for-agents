// User-facing "credits" are a derived display/billing unit, decoupled from the
// raw COGS tracked in `costCents`. This constant is the single place that
// defines a credit's value (and therefore the platform's margin over COGS).
export const MICROCENTS_PER_CREDIT = 5_000;

export function microcentsToCredits(microcents: number): number {
  return Math.round(microcents / MICROCENTS_PER_CREDIT);
}

export function centsToCredits(cents: number): number {
  return Math.round((cents * 10_000) / MICROCENTS_PER_CREDIT);
}
