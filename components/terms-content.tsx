// ── Shared prose primitives ───────────────────────────────────────────────────

function SectionHeading({
  id,
  num,
  title,
}: {
  id:    string;
  num:   number;
  title: string;
}) {
  return (
    <div id={id} className="flex items-center gap-4 mb-5 scroll-mt-28">
      <span className="text-[0.52rem] tabular-nums text-muted-foreground/30 shrink-0 w-5">
        {String(num).padStart(2, '0')}
      </span>
      <h2 className="font-heading text-lg sm:text-xl tracking-widest uppercase text-foreground">
        {title}
      </h2>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.8rem] text-muted-foreground leading-relaxed tracking-wide mb-4 last:mb-0">
      {children}
    </p>
  );
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-4 pl-4">
      {items.map((item) => (
        <li
          key={item}
          className="relative text-[0.8rem] text-muted-foreground leading-relaxed tracking-wide
                     before:content-['—'] before:absolute before:-left-4 before:text-muted-foreground/30"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-12 border-b border-border/30 last:border-0 last:pb-0">
      {children}
    </div>
  );
}

// ── Full content ──────────────────────────────────────────────────────────────

export default function TermsContent() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* 1 — Acceptance of Terms */}
        <Section>
          <SectionHeading id="acceptance" num={1} title="Acceptance of Terms" />
          <P>
            By accessing or using the AuraFume website (the &ldquo;Site&rdquo;), placing an order,
            or creating an account, you agree to be bound by these Terms &amp; Conditions in full.
            If you do not agree with any part of these terms, please do not use our Site.
          </P>
          <P>
            You must be at least{' '}
            <strong className="text-foreground/80">18 years of age</strong> to make a purchase on
            our Site. By placing an order you confirm that you meet this age requirement.
          </P>
          <P>
            These terms are governed by and construed in accordance with the laws of the Federal
            Republic of Nigeria. Any dispute arising from your use of the Site shall be subject to
            the exclusive jurisdiction of the courts of Lagos State, Nigeria.
          </P>
        </Section>

        {/* 2 — Use of the Website */}
        <Section>
          <SectionHeading id="use" num={2} title="Use of the Website" />
          <P>
            You may use the Site for lawful personal and commercial purposes only. The following
            uses are strictly prohibited:
          </P>
          <UL
            items={[
              'Scraping, crawling, or harvesting data from the Site without prior written consent',
              'Using automated bots, scripts, or tools to interact with the Site',
              'Attempting to gain unauthorised access to any part of the Site or its infrastructure',
              'Transmitting malicious code, viruses, or any content that may damage, disrupt, or interfere with the Site',
              'Reproducing, duplicating, or exploiting any part of the Site for commercial purposes without written permission',
              'Impersonating AuraFume, another user, or any third party',
            ]}
          />
          <P>
            We reserve the right to suspend or terminate access for any user found to be in breach
            of these permitted use guidelines, without notice or liability.
          </P>
        </Section>

        {/* 3 — Account Registration */}
        <Section>
          <SectionHeading id="account" num={3} title="Account Registration" />
          <P>
            When you create an account on our Site, you agree to provide accurate, current, and
            complete information. You are responsible for maintaining the confidentiality of your
            login credentials and for all activity that occurs under your account.
          </P>
          <UL
            items={[
              'You must provide truthful information during registration and keep it up to date',
              'You are solely responsible for safeguarding your password — do not share it with others',
              'Only one account is permitted per person — duplicate accounts may be removed',
              'Notify us immediately at hello@yourbrand.com if you suspect unauthorised access to your account',
            ]}
          />
          <P>
            AuraFume shall not be liable for any loss or damage arising from your failure to
            maintain the security of your account credentials.
          </P>
        </Section>

        {/* 4 — Products & Pricing */}
        <Section>
          <SectionHeading id="products" num={4} title="Products & Pricing" />
          <P>
            All prices on the Site are displayed in{' '}
            <strong className="text-foreground/80">Nigerian Naira (₦)</strong> and are inclusive
            of applicable taxes unless otherwise stated. Prices are subject to change at any time
            without prior notice.
          </P>
          <UL
            items={[
              'We make every effort to ensure product descriptions and specifications are accurate and up to date',
              'Product images are for illustrative purposes — actual colours and packaging may vary slightly due to photography and screen calibration',
              'Stock availability is displayed in real time but is not guaranteed until your order is confirmed',
              'Promotional prices apply only during the stated promotional period and cannot be applied retrospectively',
            ]}
          />
          <P>
            In the event a product is listed at an incorrect price due to a typographical error or
            system fault, we reserve the right to refuse or cancel orders placed at that incorrect
            price, with a full refund issued promptly.
          </P>
        </Section>

        {/* 5 — Orders & Payments */}
        <Section>
          <SectionHeading id="orders" num={5} title="Orders & Payments" />
          <P>
            Placing an order constitutes an offer to purchase. A binding contract is formed only
            when we send you an order confirmation email. We reserve the right to refuse or cancel
            any order at our discretion, including in cases of suspected fraud, pricing errors, or
            stock unavailability.
          </P>
          <P>We currently accept the following payment methods:</P>
          <UL
            items={[
              'Debit and credit cards (Mastercard, Visa, Verve) via Paystack — a PCI-DSS compliant payment gateway',
              'Direct bank transfer to our designated account',
            ]}
          />
          <P>
            Orders paid by{' '}
            <strong className="text-foreground/80">bank transfer</strong> are reserved but not
            confirmed until payment has been verified by our team. Proof of payment must be
            uploaded within{' '}
            <strong className="text-foreground/80">24 hours</strong> of placing the order.
            Unverified orders may be cancelled and items released back to stock.
          </P>
        </Section>

        {/* 6 — Shipping & Delivery */}
        <Section>
          <SectionHeading id="shipping" num={6} title="Shipping & Delivery" />
          <P>
            We deliver across Nigeria. Estimated delivery times are provided as a guide only and
            are not guaranteed. Delivery timelines may be affected by factors outside our control,
            including courier delays, public holidays, and adverse weather conditions.
          </P>
          <UL
            items={[
              'Lagos delivery: typically 1–2 business days after dispatch',
              'Nationwide delivery: typically 3–5 business days after dispatch',
              'Risk of loss and title for products pass to you upon delivery to your specified address',
              'We are not liable for delays caused by third-party courier services once your order has been dispatched',
              'You are responsible for ensuring your delivery address is accurate — we cannot be held liable for failed deliveries due to incorrect address information',
            ]}
          />
        </Section>

        {/* 7 — Returns & Refunds */}
        <Section>
          <SectionHeading id="returns" num={7} title="Returns & Refunds" />
          <P>
            We accept returns within{' '}
            <strong className="text-foreground/80">7 days of delivery</strong> for eligible items.
            To initiate a return, please contact us via email or WhatsApp with your order number
            and reason for return.
          </P>
          <P>To qualify for a return, items must meet all of the following conditions:</P>
          <UL
            items={[
              'Unused and in the same condition as received',
              'In the original, undamaged packaging with all seals intact',
              'Accompanied by proof of purchase (order number or receipt)',
            ]}
          />
          <P>
            Approved refunds are processed within{' '}
            <strong className="text-foreground/80">3–5 business days</strong> of our team
            receiving and inspecting the returned item. Refunds are issued via the original payment
            method.
          </P>
          <P>
            The following items are{' '}
            <strong className="text-foreground/80">non-returnable</strong>:
          </P>
          <UL
            items={[
              'Opened or used fragrances (for hygiene and safety reasons)',
              'Items purchased on sale or with a discount code, unless faulty',
              'Gift sets or bundles that have been unwrapped or partially used',
              'Items not in their original condition or packaging',
            ]}
          />
        </Section>

        {/* 8 — Intellectual Property */}
        <Section>
          <SectionHeading id="ip" num={8} title="Intellectual Property" />
          <P>
            All content on the AuraFume Site — including but not limited to text, images, graphics,
            logos, product photography, videos, and design — is the exclusive property of AuraFume
            or its licensors and is protected by Nigerian and international intellectual property
            laws.
          </P>
          <UL
            items={[
              'You may not reproduce, distribute, modify, or republish any content from the Site without prior written permission from AuraFume',
              'The AuraFume name, logo, and brand marks may not be used in any manner that could cause confusion or imply endorsement without written consent',
              'Unauthorised use of our intellectual property may result in legal action',
            ]}
          />
        </Section>

        {/* 9 — Limitation of Liability */}
        <Section>
          <SectionHeading id="liability" num={9} title="Limitation of Liability" />
          <P>
            To the maximum extent permitted by applicable law, AuraFume&apos;s total liability to
            you for any claim arising from your use of the Site or purchase of our products shall
            not exceed the value of the specific order to which the claim relates.
          </P>
          <P>
            We shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages, including but not limited to:
          </P>
          <UL
            items={[
              'Loss of profits, revenue, or business opportunities',
              'Loss of data or goodwill',
              'Damages resulting from your inability to access or use the Site',
              'Damages resulting from unauthorised access to or alteration of your account or data',
            ]}
          />
          <P>
            Nothing in these terms limits or excludes our liability for death or personal injury
            caused by our negligence, fraud, or any other liability that cannot lawfully be
            excluded.
          </P>
        </Section>

        {/* 10 — Governing Law */}
        <Section>
          <SectionHeading id="law" num={10} title="Governing Law" />
          <P>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws
            of the Federal Republic of Nigeria. You agree to submit to the exclusive jurisdiction
            of the courts of Lagos State, Nigeria to resolve any dispute arising out of or in
            connection with these terms or your use of the Site.
          </P>
          <P>
            If any provision of these terms is found to be unlawful, void, or unenforceable, that
            provision shall be deemed severable and shall not affect the validity and enforceability
            of the remaining provisions.
          </P>
        </Section>

        {/* 11 — Changes to Terms */}
        <Section>
          <SectionHeading id="changes" num={11} title="Changes to Terms" />
          <P>
            We reserve the right to update or modify these Terms &amp; Conditions at any time
            without prior notice. Changes will be effective immediately upon posting to the Site.
            The &ldquo;Last updated&rdquo; date at the top of this page will reflect the most
            recent revision.
          </P>
          <P>
            Your continued use of the Site following the posting of any changes constitutes your
            acceptance of the revised terms. We encourage you to review this page periodically to
            stay informed of any updates.
          </P>
          <P>
            If you have any questions about these terms, please contact us at{' '}
            <a href="mailto:hello@yourbrand.com" className="text-accent hover:underline">
              hello@yourbrand.com
            </a>
            .
          </P>
        </Section>

      </div>
    </section>
  );
}
