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
      // Pure client-side validation — no API call, no email cost.
      cy.visit("/sign-in");
      cy.get('input[type="email"]').type("not-an-email");
      cy.contains("button", "Sign in with email").click();
      cy.location("pathname").should("eq", "/sign-in");
      cy.contains(/invalid email/i).should("be.visible");
    });

    it("submits a valid email and lands on the verify-account page with email + next params", () => {
      // OTP request is mocked inside submitSignInEmail — no real email.
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignInEmail(email);
        cy.contains(email).should("be.visible");
      });
    });
  });

  describe("OTP verification", () => {
    it("rejects a wrong code and stays on the verify page", () => {
      // No API call needed — typing 000000 doesn't reach Supabase if there's no
      // real user. We just check the page doesn't navigate.
      cy.uniqueTestEmail().then((email) => {
        const params = new URLSearchParams({ email, next: "/mirrropilot" });
        cy.visit(`/account-setup/verify-account?${params.toString()}`);
        cy.get('[data-input-otp="true"]').type("000000");
        cy.contains("button", "Continue").click();
        cy.location("pathname").should("eq", "/account-setup/verify-account");
      });
    });

    it("accepts the correct code and lands on /mirrropilot with cookies set", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.signInViaAdminOtp(email);
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
      // Form behavior is identical to sign-in (consolidated component);
      // we only verify that the sign-up form sends the user to verify-account
      // with the correct next param. OTP request mocked.
      cy.uniqueTestEmail().then((email) => {
        cy.submitSignUpEmail(email);
        cy.contains(email).should("be.visible");
      });
    });
  });

  describe("OAuth", () => {
    it("Google button navigates to the Supabase /auth/v1/authorize endpoint", () => {
      cy.visit("/sign-in");
      cy.intercept("GET", "**/auth/v1/authorize**").as("authorize");
      cy.contains("button", "Continue with Google").click();
      cy.wait("@authorize").its("request.url").should("include", "provider=google");
    });
  });

  describe("sign-out", () => {
    it("signs the user out from the dashboard sidebar and redirects to /sign-in", () => {
      cy.uniqueTestEmail().then((email) => {
        cy.signInViaAdminOtp(email);

        // Open the sidebar profile menu and click Logout.
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
