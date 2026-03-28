'use client';

import { Pencil, User, MapPin, Truck, CreditCard, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useCheckout, type ContactSummary, type AddressSummary, type DeliveryOption, type PaymentMethod } from './checkout-context';

// ── Scroll-to helper ───────────────────────────────────────────────────────────

function scrollTo(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
}

// ── Edit button ────────────────────────────────────────────────────────────────

function EditBtn({ sectionId }: { sectionId: string }) {
  return (
    <button
      onClick={() => scrollTo(sectionId)}
      className="flex items-center gap-1 text-[0.58rem] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors shrink-0"
      aria-label="Edit this section"
    >
      <Pencil size={10} strokeWidth={1.8} />
      Edit
    </button>
  );
}

// ── Card shell ─────────────────────────────────────────────────────────────────

function ReviewCard({
  icon: Icon,
  label,
  sectionId,
  children,
  incomplete,
}: {
  icon:      React.ElementType;
  label:     string;
  sectionId: string;
  children:  React.ReactNode;
  incomplete?: boolean;
}) {
  return (
    <div className={`border px-4 py-3.5 transition-colors ${
      incomplete ? 'border-destructive/40 bg-destructive/[0.02]' : 'border-border'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={11} strokeWidth={1.8} className={incomplete ? 'text-destructive/60' : 'text-muted-foreground'} />
          <span className="text-[0.58rem] tracking-[0.22em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        <EditBtn sectionId={sectionId} />
      </div>

      {incomplete ? (
        <div className="flex items-center gap-1.5 text-[0.68rem] text-destructive/80">
          <AlertTriangle size={11} strokeWidth={1.8} className="shrink-0" />
          Not yet completed — tap Edit to fill in this section.
        </div>
      ) : (
        <div className="text-[0.76rem] text-foreground leading-snug space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Individual card contents ───────────────────────────────────────────────────

function ContactCard({ data }: { data: ContactSummary }) {
  return (
    <>
      <p className="font-medium">{data.firstName} {data.lastName}</p>
      <p className="text-foreground/70">{data.email}</p>
      <p className="text-foreground/70">{data.phone}</p>
    </>
  );
}

function AddressCard({ data }: { data: AddressSummary }) {
  return (
    <>
      <p className="font-medium">{data.street}{data.apt && `, ${data.apt}`}</p>
      <p className="text-foreground/70">{data.city}{data.state && `, ${data.state}`}</p>
      <p className="text-foreground/70">{data.country}</p>
    </>
  );
}

function DeliveryCard({ data }: { data: DeliveryOption }) {
  return (
    <>
      <p className="font-medium">{data.label}</p>
      <p className="text-foreground/70">{data.duration}</p>
      <p className="text-foreground/70 tabular-nums">
        {data.fee === 0 ? 'Free' : `₦${data.fee.toLocaleString()}`}
      </p>
    </>
  );
}

function PaymentCard({ data }: { data: PaymentMethod }) {
  return (
    <>
      <p className="font-medium">{data.label}</p>
      <p className="text-foreground/70">{data.desc}</p>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function ReviewConfirm() {
  const { contactSummary, addressSummary, deliveryOption, paymentMethod } = useCheckout();

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Review & Confirm
      </h2>

      <div className="space-y-2.5">

        {/* Contact */}
        <ReviewCard
          icon={User}
          label="Contact"
          sectionId="section-contact"
          incomplete={!contactSummary}
        >
          {contactSummary && <ContactCard data={contactSummary} />}
        </ReviewCard>

        {/* Delivery address */}
        <ReviewCard
          icon={MapPin}
          label="Delivery Address"
          sectionId="section-address"
          incomplete={!addressSummary}
        >
          {addressSummary && <AddressCard data={addressSummary} />}
        </ReviewCard>

        {/* Delivery method */}
        <ReviewCard
          icon={Truck}
          label="Delivery Method"
          sectionId="section-delivery"
          incomplete={!deliveryOption}
        >
          {deliveryOption && <DeliveryCard data={deliveryOption} />}
        </ReviewCard>

        {/* Payment */}
        <ReviewCard
          icon={CreditCard}
          label="Payment"
          sectionId="section-payment"
          incomplete={!paymentMethod}
        >
          {paymentMethod && <PaymentCard data={paymentMethod} />}
        </ReviewCard>

      </div>
    </motion.section>
  );
}
