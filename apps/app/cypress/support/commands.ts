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
       * Drives the sign-in form with the given email and waits for the redirect
       * to /account-setup/verify-account. Does not enter the OTP code.
       */
      submitSignInEmail(email: string): Chainable<void>;

      /**
       * Drives the sign-up form with the given email and waits for the redirect
       * to /account-setup/verify-account.
       */
      submitSignUpEmail(email: string): Chainable<void>;

      /**
       * Pulls the email_otp for a given email via the admin API and types it
       * into the OTP input on /account-setup/verify-account.
       */
      enterOtpFromAdmin(email: string, options?: { shouldCreateUser?: boolean }): Chainable<void>;

      /**
       * Convenience: end-to-end sign-in to /mirrropilot for an arbitrary email.
       * Uses the verify-account UI; does NOT bypass the app session boundary.
       */
      signInViaUi(email: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("uniqueTestEmail", (prefix = "e2e") => {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return cy.wrap(`${prefix}-${id}@e2e.mirrorverse.test`);
});

Cypress.Commands.add("submitSignInEmail", (email: string) => {
  cy.visit("/sign-in");
  cy.get('input[type="email"]').type(email);
  cy.contains("button", "Sign in with email").click();
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/account-setup/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirrropilot");
});

Cypress.Commands.add("submitSignUpEmail", (email: string) => {
  cy.visit("/sign-up");
  cy.get('input[type="email"]').type(email);
  // Sign-up's submit button is "Continue"; the OAuth buttons also start with "Continue with..."
  // so we scope the selector to the form's submit button (type="submit").
  cy.get('form button[type="submit"]').click();
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/account-setup/verify-account");
  cy.location("search").should("include", `email=${encodeURIComponent(email)}`);
  cy.location("search").should("include", "next=%2Fmirrropilot");
});

Cypress.Commands.add(
  "enterOtpFromAdmin",
  (email: string, options: { shouldCreateUser?: boolean } = {}) => {
    cy.task<GeneratedOtp>("generateOtp", {
      email,
      shouldCreateUser: options.shouldCreateUser,
    }).then((otp) => {
      const code = otp.email_otp;
      if (typeof code !== "string" || code.length !== 6) {
        throw new Error(`Expected 6-digit OTP from admin API, got: ${JSON.stringify(otp)}`);
      }
      // shadcn InputOTP renders a single hidden text input that accepts the full string.
      cy.get('[data-input-otp="true"]').type(code);
      cy.contains("button", "Continue").click();
    });
  },
);

Cypress.Commands.add("signInViaUi", (email: string) => {
  cy.submitSignInEmail(email);
  cy.enterOtpFromAdmin(email);
  cy.location("pathname", { timeout: 15_000 }).should("eq", "/mirrropilot");
});

export {};
