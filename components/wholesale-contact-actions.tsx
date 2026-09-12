import { Phone, Mail, ArrowUpRight } from 'lucide-react';
import {
  WHOLESALE_PHONE_DISPLAY,
  WHOLESALE_PHONE_TEL,
  WHOLESALE_EMAIL,
  WHOLESALE_MAILTO,
} from '@/lib/wholesale';

type Tone = 'dark' | 'light';

const TONES: Record<Tone, { card: string; label: string; value: string; icon: string; arrow: string }> = {
  // For use on bg-primary (near-black) surfaces
  dark: {
    card:  'border-primary-foreground/12 hover:border-accent/70 hover:bg-primary-foreground/[0.03]',
    label: 'text-primary-foreground/40',
    value: 'text-primary-foreground group-hover:text-accent',
    icon:  'border-primary-foreground/15 text-accent group-hover:border-accent/70',
    arrow: 'text-primary-foreground/30 group-hover:text-accent',
  },
  // For use on ivory / beige surfaces
  light: {
    card:  'border-border hover:border-accent bg-background/60 hover:bg-background',
    label: 'text-muted-foreground/70',
    value: 'text-foreground group-hover:text-accent',
    icon:  'border-border text-accent group-hover:border-accent',
    arrow: 'text-muted-foreground/50 group-hover:text-accent',
  },
};

/** Tappable "Call" and "Email" cards that show the actual number and address. */
export default function WholesaleContactActions({ tone = 'dark' }: { tone?: Tone }) {
  const t = TONES[tone];

  const items = [
    {
      id:    'phone',
      label: 'Call Wholesale',
      value: WHOLESALE_PHONE_DISPLAY,
      href:  WHOLESALE_PHONE_TEL,
      icon:  <Phone size={16} strokeWidth={1.5} />,
    },
    {
      id:    'email',
      label: 'Email Wholesale',
      value: WHOLESALE_EMAIL,
      href:  WHOLESALE_MAILTO,
      icon:  <Mail size={16} strokeWidth={1.5} />,
    },
  ];

  return (
    // Container query: cards sit side by side only when there is room for the full number and email
    <div className="@container">
      <div className="grid grid-cols-1 @[38rem]:grid-cols-2 gap-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`group flex items-center gap-4 border px-4 py-4 transition-colors duration-200 ${t.card}`}
          >
            <span
              className={`w-10 h-10 shrink-0 flex items-center justify-center border transition-colors duration-200 ${t.icon}`}
            >
              {item.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className={`block text-[0.55rem] tracking-[0.25em] uppercase mb-1 ${t.label}`}>
                {item.label}
              </span>
              <span
                className={`block text-[0.9rem] tracking-wide truncate transition-colors duration-200 ${t.value}`}
              >
                {item.value}
              </span>
            </span>

            <ArrowUpRight
              size={15}
              strokeWidth={1.6}
              className={`shrink-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${t.arrow}`}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
