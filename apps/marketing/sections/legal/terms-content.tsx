import { SectionHeader } from "@/components/section-header";

export function TermsContent() {
  return (
    <section className="bg-white">
      <div className="px-5 pb-24 lg:px-0 lg:pt-[160px] mx-auto w-full max-w-[760px] pt-[140px]">
        <SectionHeader title="Terms &amp; Conditions" align="left" />
        <p className="mt-3 text-sm text-[#737373]">Last updated: January 1, 2026</p>

        <div className="mt-10 gap-10 flex flex-col text-[15px] leading-[26px] text-[#404040]">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using the mirrorverse platform, you agree to be bound by
              these Terms &amp; Conditions and our Privacy Policy. If you do not agree, do not use
              our services. These terms apply to all users, including free and paid plan
              subscribers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">2. Use of the Platform</h2>
            <p>You agree to use mirrorverse only for lawful purposes. You may not:</p>
            <ul className="mt-3 gap-2 pl-5 flex flex-col">
              {[
                "Use the platform to send spam, conduct phishing attacks, or engage in any fraudulent activity",
                "Attempt to reverse-engineer, decompile, or extract the source code of our platform",
                "Use the platform in any way that violates applicable laws or regulations",
                "Share your account credentials with unauthorized parties",
                "Interfere with or disrupt the integrity of the mirrorverse service",
              ].map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">
              3. Billing and Subscriptions
            </h2>
            <p>
              Paid subscriptions are billed monthly or annually in advance. By providing payment
              information, you authorize mirrorverse to charge the applicable fees. All fees are
              non-refundable except as required by law or as stated in our refund policy.
            </p>
            <p className="mt-3">
              We reserve the right to modify pricing with 30 days&apos; notice. If you disagree with
              a price change, you may cancel before the new pricing takes effect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">4. Intellectual Property</h2>
            <p>
              mirrorverse retains all rights, title, and interest in the platform and its underlying
              technology. You retain ownership of any content, data, or configurations you create
              using the platform. You grant mirrorverse a limited license to process your data
              solely to provide the services described in these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">
              5. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, mirrorverse shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages — including loss
              of profits, data, or business opportunities — arising from your use of the platform.
            </p>
            <p className="mt-3">
              Our total liability for any claim arising from these terms shall not exceed the amount
              you paid mirrorverse in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">6. Termination</h2>
            <p>
              You may cancel your account at any time from your account settings. We reserve the
              right to suspend or terminate accounts that violate these terms, with or without
              notice. Upon termination, your right to use the platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">7. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of California, without regard to
              conflict of law principles. Any disputes arising from these terms shall be resolved
              exclusively in the state or federal courts located in San Francisco County,
              California.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">8. Contact Us</h2>
            <p>
              Questions about these Terms &amp; Conditions? Contact us at{" "}
              <a
                href="mailto:legal@mirrorverse.ai"
                className="font-medium text-[#0a0a0a] underline underline-offset-4"
              >
                legal@mirrorverse.ai
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
