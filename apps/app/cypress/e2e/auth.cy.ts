/// <reference types="cypress" />

describe("Authentication", () => {
  describe("middleware route gating", () => {
    it("redirects to /sign-in when an unauthenticated user visits /mirrropilot", () => {
      cy.visit("/mirrropilot", { failOnStatusCode: false });
      cy.location("pathname", { timeout: 10_000 }).should("eq", "/sign-in");
      cy.location("search").should("include", "redirect_url");
    });

    it("redirects to /sign-in when an unauthenticated user visits /", () => {
      cy.visit("/");
      cy.location("pathname", { timeout: 10_000 }).should("eq", "/sign-in");
    });
  });

  describe("sign-in form", () => {
    it("rejects an invalid email", () => {
      cy.visit("/sign-in");
      cy.get('input[type="email"]').type("not-an-email");
      cy.contains("button", "Sign in with email").click();
      cy.location("pathname").should("eq", "/sign-in");
      cy.contains(/invalid email/i).should("be.visible");
    });

    it("submits a valid email and lands on the verify-account page with email + next params", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignInEmail(email);
        cy.contains(email).should("be.visible");
        cy.task("deleteUserByEmail", { email });
      });
    });
  });

  describe("OTP verification", () => {
    it("rejects a wrong code and stays on the verify page", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignInEmail(email);
        cy.get('[data-input-otp="true"]').type("000000");
        cy.contains("button", "Continue").click();
        cy.location("pathname").should("eq", "/account-setup/verify-account");
        cy.task("deleteUserByEmail", { email });
      });
    });

    it("accepts the correct code and lands on /mirrropilot with cookies set", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignInEmail(email);
        cy.enterOtpFromAdmin(email);
        cy.location("pathname", { timeout: 15_000 }).should("eq", "/mirrropilot");
        cy.getAllCookies().then((cookies) => {
          const hasSupabaseAuth = cookies.some((c) => /^sb-.*-auth-token/.test(c.name));
          expect(hasSupabaseAuth, "Supabase auth cookie should be set").to.equal(true);
        });
        cy.task("deleteUserByEmail", { email });
      });
    });

    it("falls back to the 'no email' state when visited without the email param", () => {
      cy.visit("/account-setup/verify-account");
      cy.contains(/no email address provided/i).should("be.visible");
    });
  });

  describe("sign-up form", () => {
    it("submits and routes the post-OTP redirect to /mirrropilot", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignUpEmail(email);
        cy.enterOtpFromAdmin(email);
        cy.location("pathname", { timeout: 15_000 }).should("eq", "/mirrropilot");
        cy.task("deleteUserByEmail", { email });
      });
    });
  });

  describe("OAuth", () => {
    it("Google button navigates to the Supabase /auth/v1/authorize endpoint", () => {
      cy.visit("/sign-in");
      // Stub navigations so the cross-origin redirect doesn't navigate Cypress away.
      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen");
      });
      // The OAuth button uses a full-page navigation via supabase-js; intercept the
      // call to /auth/v1/authorize and assert on its URL instead of waiting for the
      // navigation to complete (which would leave Cypress on accounts.google.com).
      cy.intercept("GET", "**/auth/v1/authorize**").as("authorize");
      cy.contains("button", "Continue with Google").click();
      cy.wait("@authorize").its("request.url").should("include", "provider=google");
    });
  });

  describe("sign-out", () => {
    it("signs the user out from the dashboard sidebar and redirects to /sign-in", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.signInViaUi(email);

        // Open the profile menu and click Logout.
        cy.contains("button", /ellipsis|menu/i)
          .filter(":visible")
          .first()
          .click({ force: true });
        cy.contains(/^logout$/i).click({ force: true });

        cy.location("pathname", { timeout: 15_000 }).should("eq", "/sign-in");
        cy.getAllCookies().then((cookies) => {
          const hasSupabaseAuth = cookies.some((c) => /^sb-.*-auth-token/.test(c.name));
          expect(hasSupabaseAuth, "Supabase auth cookie should be cleared").to.equal(false);
        });

        cy.task("deleteUserByEmail", { email });
      });
    });
  });
});
