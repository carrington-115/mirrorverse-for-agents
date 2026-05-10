/// <reference types="cypress" />

interface GeneratedOtp {
  email_otp: string;
  hashed_token: string;
  user_id: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Generates a unique e2e email address. Pass to cy.task('deleteUserByEmail')
       * in afterEach to keep the test project clean.
       */
      uniqueTestEmail(prefix?: string): Chainable<string>;

      /**
       * Sets up a network intercept that fakes a successful response to Supabase's
       * /auth/v1/otp endpoint, so the form-submission flow doesn't actually send
       * a real email. Use for any test that only needs to verify form behavior /
       * redirects, not the verifyOtp round-trip. Saves email-rate-limit budget.
       */
      mockOtpRequest(): Chainable<void>;

      /**
       * Drives the sign-in form with the given email and waits for the redirect
       * to /onboarding/verify-account. Mocks the OTP send — no real email.
       */
      submitSignInEmail(email: string): Chainable<void>;

      /**
       * Drives the sign-up form with the given email and waits for the redirect
       * to /onboarding/verify-account. Mocks the OTP send — no real email.
       */
      submitSignUpEmail(email: string): Chainable<void>;

      /**
       * End-to-end UI sign-in for tests that need a real session.
       *
       * Bypasses the sign-in form (which would send an extra email) and goes
       * straight to /onboarding/verify-account, then verifies a real OTP
       * obtained via the admin API. Uses 1 email per call.
       *
       * Returns the user to whatever `next` says — defaults to /mirropilot.
       */
      signInViaAdminOtp(email: string, next?: string): Chainable<void>;
    }
  }
}

// Mirrors a real Supabase /auth/v1/otp success response shape, with the
// content-type header that supabase-js needs to parse the body as JSON.
const OTP_INTERCEPT_RESPONSE = {
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: { messaging_provider: null, messageId: null },
};

// CORS preflight response. supabase-js sends an `apikey` header which is not on
// the CORS-safe list, so the browser issues an OPTIONS preflight before the
// POST. If we don't stub it, the preflight escapes to real Supabase and burns
// rate limit / can fail.
const PREFLIGHT_RESPONSE = {
  statusCode: 204,
  headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "*",
    "access-control-max-age": "86400",
  },
};

const OTP_URL_REGEX = /supabase\.co\/auth\/v1\/otp(?:\?|$)/;

Cypress.Commands.add("uniqueTestEmail", (prefix = "e2e") => {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  // example.com is the universal "test" domain (RFC 2606). zod 4's z.email()
  // accepts it; reserved TLDs like .test can be rejected by stricter validators.
  return cy.wrap(`${prefix}-${id}@example.com`);
});

Cypress.Commands.add("mockOtpRequest", () => {
  cy.intercept({ method: "OPTIONS", url: OTP_URL_REGEX }, PREFLIGHT_RESPONSE).as("otpPreflight");
  cy.intercept({ method: "POST", url: OTP_URL_REGEX }, OTP_INTERCEPT_RESPONSE).as("otpRequest");
});

Cypress.Commands.add("submitSignInEmail", (email: string) => {
  cy.mockOtpRequest();
  cy.visit("/sign-in");
  cy.get('input[type="email"]').type(email);
  cy.contains("button", "Sign in with email").click();
  cy.wait("@otpRequest");
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/onboarding/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirropilot");
});

Cypress.Commands.add("submitSignUpEmail", (email: string) => {
  cy.mockOtpRequest();
  cy.visit("/sign-up");
  cy.get('input[type="email"]').type(email);
  // Sign-up's submit button is "Continue"; the OAuth buttons also start with "Continue with..."
  // so we scope the selector to the form's submit button (type="submit").
  cy.get('form button[type="submit"]').click();
  cy.wait("@otpRequest");
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/onboarding/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirropilot");
});

Cypress.Commands.add("signInViaAdminOtp", (email: string, next: string = "/mirropilot") => {
  cy.task<GeneratedOtp>("generateOtp", { email, shouldCreateUser: true }).then((otp) => {
    const code = otp.email_otp;
    if (typeof code !== "string" || code.length !== 6) {
      throw new Error(`Expected 6-digit OTP from admin API, got: ${JSON.stringify(otp)}`);
    }
    const params = new URLSearchParams({ email, next });
    cy.visit(`/onboarding/verify-account?${params.toString()}`);
    cy.get('[data-input-otp="true"]').type(code);
    cy.contains("button", "Continue").click();
    cy.location("pathname", { timeout: 15_000 }).should("eq", next);
  });
});

export {};
