// ── Prose primitives ──────────────────────────────────────────────────────────

function SectionHeading({
  id,
  num,
  title,
}: {
  id: string;
  num: number;
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

function UL({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2 mb-4 pl-4">
      {items.map((item, i) => (
        <li
          key={i}
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

function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-foreground/80">{children}</strong>;
}

// ── Full content ──────────────────────────────────────────────────────────────

export default function PrivacyContent() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Intro */}
        <P>
          At AuraFume, your privacy matters to us. This Privacy Policy explains
          what information we collect when you visit our website or place an
          order, how we use it, and the choices you have. By using our Site you
          agree to the practices described here.
        </P>

        {/* 1 — Information We Collect */}
        <Section>
          <SectionHeading id="collect" num={1} title="Information We Collect" />
          <P>We collect information in the following categories:</P>
          <P>
            <B>Personal information</B> — provided directly by you when you
            create an account, place an order, or contact us:
          </P>
          <UL
            items={[
              'Full name and email address',
              'Phone number',
              'Delivery and billing address',
            ]}
          />
          <P>
            <B>Payment information</B> — card payments are processed securely by{' '}
            <B>Paystack</B>, a PCI-DSS compliant payment gateway. We do not
            store, transmit, or have access to your card number, CVV, or PIN at
            any point. For bank transfers, we retain only the proof of payment
            image you voluntarily upload.
          </P>
          <P>
            <B>Usage data</B> — collected automatically as you browse our Site:
          </P>
          <UL
            items={[
              'Pages visited and time spent on each page',
              'Products viewed, added to cart, or wishlisted',
              'Search queries entered on the Site',
              'Referral source (how you arrived at our Site)',
            ]}
          />
          <P>
            <B>Device and technical information</B> — collected automatically by
            our servers:
          </P>
          <UL
            items={[
              'Browser type and version',
              'Operating system',
              'IP address and approximate geographic location (country / city)',
              'Device type (desktop, mobile, tablet)',
            ]}
          />
        </Section>

        {/* 2 — How We Use Your Information */}
        <Section>
          <SectionHeading
            id="use"
            num={2}
            title="How We Use Your Information"
          />
          <P>We use the information we collect for the following purposes:</P>
          <UL
            items={[
              <>
                <B>Processing orders and payments</B> — to fulfil your
                purchases, arrange delivery, and issue receipts and invoices.
              </>,
              <>
                <B>Order communication</B> — to send order confirmations,
                dispatch notifications, and delivery updates via email.
              </>,
              <>
                <B>Account management</B> — to create and maintain your account,
                enable saved addresses, and provide access to your order
                history.
              </>,
              <>
                <B>Personalisation</B> — to recommend products, remember your
                preferences, and tailor your shopping experience based on
                browsing history.
              </>,
              <>
                <B>Service improvement</B> — to analyse usage patterns, fix
                bugs, and improve the performance and design of our Site.
              </>,
              <>
                <B>Marketing communications</B> — to send promotional emails,
                new arrival announcements, and exclusive offers. We will only
                send marketing emails with your explicit consent, and you can
                opt out at any time via the unsubscribe link in any email or
                through your account notification settings.
              </>,
              <>
                <B>Legal compliance</B> — to comply with applicable Nigerian law
                and respond to lawful requests from regulatory authorities.
              </>,
            ]}
          />
        </Section>

        {/* 3 — How We Share Your Information */}
        <Section>
          <SectionHeading
            id="share"
            num={3}
            title="How We Share Your Information"
          />
          <P>
            We do not sell, rent, or trade your personal data to any third party
            for their own marketing purposes. We share your information only in
            the following limited circumstances:
          </P>
          <UL
            items={[
              <>
                <B>Delivery partners</B> — we share your name, phone number, and
                delivery address with our courier or logistics partners solely
                to fulfil your order.
              </>,
              <>
                <B>Payment processors</B> — Paystack receives the information
                necessary to process your card payment. Their handling of your
                data is governed by{' '}
                <a
                  href="https://paystack.com/privacy/merchant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Paystack&apos;s Privacy Policy
                </a>
                .
              </>,
              <>
                <B>Service providers</B> — we may share data with trusted
                technology providers (e.g. cloud hosting, email delivery) who
                process it solely on our behalf and under strict confidentiality
                obligations.
              </>,
              <>
                <B>Legal requirements</B> — we may disclose your information if
                required to do so by law, court order, or a competent regulatory
                authority in Nigeria.
              </>,
            ]}
          />
        </Section>

        {/* 4 — Data Storage & Security */}
        <Section>
          <SectionHeading
            id="storage"
            num={4}
            title="Data Storage & Security"
          />
          <P>
            We take the security of your personal data seriously and have
            implemented a range of technical and organisational measures to
            protect it:
          </P>
          <UL
            items={[
              <>
                <B>Encrypted database</B> — your data is stored in a MongoDB
                database with encryption at rest.
              </>,
              <>
                <B>SSL / HTTPS encryption</B> — all data transmitted between
                your browser and our servers is encrypted using TLS.
              </>,
              <>
                <B>Secure password hashing</B> — passwords are hashed using
                bcrypt before storage. We never store plaintext passwords.
              </>,
              <>
                <B>Access controls</B> — access to production systems and
                customer data is restricted to authorised team members only.
              </>,
              <>
                <B>Security reviews</B> — we conduct regular security reviews
                and apply patches promptly to maintain a secure environment.
              </>,
            ]}
          />
          <P>
            While we employ industry-standard security measures, no system is
            completely immune to risk. In the unlikely event of a data breach
            that affects your personal data, we will notify you promptly in
            accordance with applicable law.
          </P>
        </Section>

        {/* 5 — Cookies & Tracking */}
        <Section>
          <SectionHeading id="cookies" num={5} title="Cookies & Tracking" />
          <P>
            We use cookies and similar technologies to operate our Site and
            improve your experience. Cookies are small text files stored on your
            device by your browser.
          </P>
          <UL
            items={[
              <>
                <B>Essential cookies</B> — required for the Site to function.
                These include your session token and shopping cart contents. You
                cannot opt out of these without losing core functionality.
              </>,
              <>
                <B>Analytics cookies</B> — we use Google Analytics to understand
                how visitors use our Site (pages visited, time on site, referral
                source). This data is aggregated and anonymised. You can opt out
                by installing the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </>,
              <>
                <B>Marketing cookies</B> — optional cookies used to show you
                relevant advertisements or offers. These are only set with your
                consent.
              </>,
            ]}
          />
          <P>
            You can manage or withdraw your cookie preferences at any time
            through your browser settings. Clearing cookies will log you out of
            your account and reset your cart.
          </P>
        </Section>

        {/* 6 — Your Rights */}
        <Section>
          <SectionHeading id="rights" num={6} title="Your Rights" />
          <P>
            You have the following rights in relation to the personal data we
            hold about you. To exercise any of these rights, contact us at{' '}
            <a
              href="mailto:hello@yourbrand.com"
              className="text-accent hover:underline"
            >
              hello@yourbrand.com
            </a>
            :
          </P>
          <UL
            items={[
              <>
                <B>Right to access</B> — you may request a copy of the personal
                data we hold about you.
              </>,
              <>
                <B>Right to rectification</B> — you may ask us to correct
                inaccurate or incomplete personal data. You can also update most
                information directly in your account settings.
              </>,
              <>
                <B>Right to erasure</B> — you may request that we delete your
                account and associated personal data, subject to any legal
                obligations that require us to retain certain records.
              </>,
              <>
                <B>Right to opt out of marketing</B> — you can unsubscribe from
                marketing emails at any time via the link in any email or
                through Account → Notifications.
              </>,
              <>
                <B>Right to data portability</B> — you may request a copy of
                your personal data in a structured, machine-readable format.
              </>,
            ]}
          />
          <P>
            We will respond to all legitimate requests within <B>30 days</B>.
            For complex or multiple requests, we may extend this period and will
            notify you accordingly.
          </P>
        </Section>

        {/* 7 — Children's Privacy */}
        <Section>
          <SectionHeading id="children" num={7} title="Children's Privacy" />
          <P>
            Our Site is not directed at children under the age of <B>13</B> and
            we do not knowingly collect personal information from anyone under
            this age. If you are under 13, please do not use our Site or provide
            any personal information.
          </P>
          <P>
            If we become aware that we have inadvertently collected personal
            data from a child under 13, we will delete that information
            promptly. If you believe we may have collected information from a
            minor, please contact us immediately at{' '}
            <a
              href="mailto:hello@yourbrand.com"
              className="text-accent hover:underline"
            >
              hello@yourbrand.com
            </a>
            .
          </P>
        </Section>

        {/* 8 — Changes to This Policy */}
        <Section>
          <SectionHeading id="changes" num={8} title="Changes to This Policy" />
          <P>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, or legal requirements. The
            &ldquo;Last updated&rdquo; date at the top of this page will always
            indicate the most recent revision.
          </P>
          <P>
            For <B>significant changes</B> — such as a change in how we use your
            personal data or a new sharing arrangement — we will notify you
            directly via the email address associated with your account before
            the changes take effect.
          </P>
          <P>
            Your continued use of our Site after any changes are posted
            constitutes your acceptance of the updated policy. We encourage you
            to review this page periodically.
          </P>
        </Section>

        {/* 9 — Contact Us */}
        <Section>
          <SectionHeading id="contact" num={9} title="Contact Us" />
          <P>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or the way we handle your personal data, please
            contact us:
          </P>
          <UL
            items={[
              <>
                <B>Email:</B>{' '}
                <a
                  href="mailto:hello@yourbrand.com"
                  className="text-accent hover:underline"
                >
                  hello@yourbrand.com
                </a>
              </>,
              <>
                <B>Subject line:</B> &ldquo;Privacy Enquiry&rdquo;
              </>,
              <>
                <B>Response time:</B> We aim to respond to all privacy-related
                requests within <B>30 days</B> of receipt.
              </>,
            ]}
          />
          <P>
            We are committed to working with you to resolve any concerns about
            your privacy fairly and transparently.
          </P>
        </Section>
      </div>
    </section>
  );
}
