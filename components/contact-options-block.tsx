import Link from 'next/link';
import { Mail, MessageCircle, MapPin } from 'lucide-react';

const GOLD = 'oklch(0.72 0.10 74)';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Shop+17+18+Canaan+Line+Rivers+2+Plaza+Balogun+Tradefair+Complex+Lagos';

const WHATSAPP_URL = 'https://wa.me/2348012345678';

export default function ContactOptionsBlock() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Email ── */}
        <div className="border border-border p-8 flex flex-col gap-5">
          <div
            className="w-11 h-11 flex items-center justify-center border border-border/60"
            style={{ color: GOLD }}
          >
            <Mail size={20} strokeWidth={1.5} />
          </div>

          <div className="flex-1 space-y-1.5">
            <p className="text-[0.55rem] tracking-[0.25em] uppercase text-muted-foreground/50">
              Email Us
            </p>
            <p className="font-heading text-[0.95rem] tracking-wide text-foreground">
              hello@yourbrand.com
            </p>
            <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
              We reply within 24 hours
            </p>
          </div>

          <Link
            href="mailto:hello@yourbrand.com"
            className="inline-flex items-center gap-2 text-[0.58rem] tracking-[0.22em] uppercase font-medium text-foreground border border-border/60 h-10 px-5 hover:border-accent hover:text-accent transition-colors duration-200 self-start"
          >
            Send Email
          </Link>
        </div>

        {/* ── WhatsApp ── */}
        <div className="border border-border p-8 flex flex-col gap-5">
          <div
            className="w-11 h-11 flex items-center justify-center border border-border/60"
            style={{ color: GOLD }}
          >
            <MessageCircle size={20} strokeWidth={1.5} />
          </div>

          <div className="flex-1 space-y-1.5">
            <p className="text-[0.55rem] tracking-[0.25em] uppercase text-muted-foreground/50">
              WhatsApp
            </p>
            <p className="font-heading text-[0.95rem] tracking-wide text-foreground">
              +234 801 234 5678
            </p>
            <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
              Mon–Sat, 9AM–6PM
            </p>
          </div>

          <Link
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[0.58rem] tracking-[0.22em] uppercase font-medium text-foreground border border-border/60 h-10 px-5 hover:border-accent hover:text-accent transition-colors duration-200 self-start"
          >
            Chat with Us
          </Link>
        </div>

        {/* ── Visit Us ── */}
        <div className="border border-border p-8 flex flex-col gap-5">
          <div
            className="w-11 h-11 flex items-center justify-center border border-border/60"
            style={{ color: GOLD }}
          >
            <MapPin size={20} strokeWidth={1.5} />
          </div>

          <div className="flex-1 space-y-1.5">
            <p className="text-[0.55rem] tracking-[0.25em] uppercase text-muted-foreground/50">
              Visit Us
            </p>
            <p className="font-heading text-[0.95rem] tracking-wide text-foreground leading-snug">
              Shop 17/18 Canaan Line,<br />
              Rivers 2 Plaza, Balogun<br />
              Tradefair Complex, Lagos
            </p>
            <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
              Mon–Sat, 9AM–6PM
            </p>
          </div>

          <Link
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[0.58rem] tracking-[0.22em] uppercase font-medium text-foreground border border-border/60 h-10 px-5 hover:border-accent hover:text-accent transition-colors duration-200 self-start"
          >
            Get Directions
          </Link>
        </div>
      </div>
    </section>
  );
}
