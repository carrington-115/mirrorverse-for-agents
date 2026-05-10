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
       * to /account-setup/verify-account. Mocks the OTP send — no real email.
       */
      submitSignInEmail(email: string): Chainable<void>;

      /**
       * Drives the sign-up form with the given email and waits for the redirect
       * to /account-setup/verify-account. Mocks the OTP send — no real email.
       */
      submitSignUpEmail(email: string): Chainable<void>;

      /**
       * End-to-end UI sign-in for tests that need a real session.
       *
       * Bypasses the sign-in form (which would send an extra email) and goes
       * straight to /account-setup/verify-account, then verifies a real OTP
       * obtained via the admin API. Uses 1 email per call.
       *
       * Returns the user to whatever `next` says — defaults to /mirrropilot.
       */
      signInViaAdminOtp(email: string, next?: string): Chainable<void>;
    }
  }
}

const OTP_INTERCEPT_RESPONSE = { statusCode: 200, body: { messageId: null } };
// Regex match against the full URL — globs in cy.intercept are minimatch-flavored
// and have edge cases with `**` across the protocol/host boundary.
const OTP_URL_REGEX = /\/auth\/v1\/otp(\?|$)/;

Cypress.Commands.add("uniqueTestEmail", (prefix = "e2e") => {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return cy.wrap(`${prefix}-${id}@e2e.mirrorverse.test`);
});

Cypress.Commands.add("mockOtpRequest", () => {
  cy.intercept({ method: "POST", url: OTP_URL_REGEX }, OTP_INTERCEPT_RESPONSE).as("otpRequest");
});

Cypress.Commands.add("submitSignInEmail", (email: string) => {
  cy.mockOtpRequest();
  cy.visit("/sign-in");
  cy.get('input[type="email"]').type(email);
  cy.contains("button", "Sign in with email").click();
  cy.wait("@otpRequest");
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/account-setup/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirrropilot");
});

Cypress.Commands.add("submitSignUpEmail", (email: string) => {
  cy.mockOtpRequest();
  cy.visit("/sign-up");
  cy.get('input[type="email"]').type(email);
  // Sign-up's submit button is "Continue"; the OAuth buttons also start with "Continue with..."
  // so we scope the selector to the form's submit button (type="submit").
  cy.get('form button[type="submit"]').click();
  cy.wait("@otpRequest");
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/account-setup/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirrropilot");
});

Cypress.Commands.add("signInViaAdminOtp", (email: string, next: string = "/mirrropilot") => {
  cy.task<GeneratedOtp>("generateOtp", { email, shouldCreateUser: true }).then((otp) => {
    const code = otp.email_otp;
    if (typeof code !== "string" || code.length !== 6) {
      throw new Error(`Expected 6-digit OTP from admin API, got: ${JSON.stringify(otp)}`);
    }
    const params = new URLSearchParams({ email, next });
    cy.visit(`/account-setup/verify-account?${params.toString()}`);
    cy.get('[data-input-otp="true"]').type(code);
    cy.contains("button", "Continue").click();
    cy.location("pathname", { timeout: 15_000 }).should("eq", next);
  });
});

export {};
