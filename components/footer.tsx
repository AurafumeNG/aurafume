'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowUp, Landmark } from 'lucide-react';
import Image from 'next/image';

// ── Inline brand SVG icons ──────────────────────────────────────────
function IgIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.54V6.78a4.85 4.85 0 0 1-1.07-.09z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ── Nav data ────────────────────────────────────────────────────────
const navColumns = [
  {
    id: 'shop',
    title: 'Shop',
    links: [
      { label: 'All Fragrances', href: '/shop' },
      { label: 'New Arrivals', href: '/shop/new' },
      { label: 'Bestsellers', href: '/shop/bestsellers' },
      { label: 'Gift Sets', href: '/shop/gifts' },
      { label: 'Collections', href: '/collections' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    links: [
      { label: 'FAQs', href: '/faq' },
      { label: 'Shipping & Delivery', href: '/shipping' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Track Your Order', href: '/track' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'The AuraFume Edit', href: '/editorial' },
      { label: 'Press', href: '/press' },
      { label: 'Careers', href: '/careers' },
      { label: 'Wholesale', href: '/wholesale' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
];

const socials = [
  {
    id: 'ig',
    label: 'Instagram',
    href: 'https://instagram.com/aurafumeng',
    icon: <IgIcon />,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/@aurafumeng',
    icon: <TikTokIcon />,
  },
  {
    id: 'wa',
    label: 'WhatsApp',
    href: 'https://wa.me/2348000000000?text=Hello%20AuraFume%2C%20I%27d%20like%20to%20enquire%20about%20your%20fragrances.',
    icon: <WhatsAppIcon />,
  },
];

const currencies = ['NGN ₦', 'USD $', 'GBP £', 'EUR €'];

const paymentMethods = ['Visa', 'Mastercard', 'Paystack', 'Bank Transfer'];

// ── Accordion column (mobile only) ─────────────────────────────────
function NavColumn({
  column,
  open,
  onToggle,
}: {
  column: (typeof navColumns)[0];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-primary-foreground/10 md:border-none">
      {/* Mobile toggle */}
      <button
        className="md:hidden w-full flex items-center justify-between py-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-[0.68rem] tracking-[0.25em] uppercase font-medium">
          {column.title}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Desktop heading */}
      <p className="hidden md:block text-[0.68rem] tracking-[0.25em] uppercase text-primary-foreground/50 font-medium mb-5">
        {column.title}
      </p>

      {/* Links — animated on mobile, always visible on desktop */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out md:overflow-visible md:max-h-none md:opacity-100 ${
          open
            ? 'max-h-64 opacity-100 pb-4'
            : 'max-h-0 opacity-0 md:opacity-100'
        }`}
      >
        <ul className="flex flex-col gap-3">
          {column.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-primary-foreground/45 hover:text-accent text-[0.8rem] leading-none transition-colors duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Payment badge ───────────────────────────────────────────────────
function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-primary-foreground/12 text-primary-foreground/35 text-[0.52rem] tracking-[0.12em] uppercase">
      {label === 'Bank Transfer' && <Landmark size={10} strokeWidth={1.5} />}
      {label}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function Footer() {
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [currency, setCurrency] = useState('NGN ₦');

  function backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="bg-primary">
      {/* Gold top accent line */}
      <div className="h-px bg-accent/40 w-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* ── Main grid ── */}
        <div className="py-14 md:py-20 grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-10 lg:gap-16">
          {/* Brand column */}
          <div className="md:col-span-1 pb-8 md:pb-0 border-b border-primary-foreground/10 md:border-none">
            {/* Wordmark */}
            {/* <Link href="/" className="inline-block mb-4">
              <span className="font-heading text-[1.45rem] tracking-[0.12em] text-primary-foreground">
                AuraFume
              </span>
            </Link> */}

            <Link href="/" className="shrink-0">
              <Image
                src="/logo/aurafumeng-logo-white.png"
                alt="AuraFume"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Tagline */}
            <p className="mt-3 text-primary-foreground/40 text-[0.75rem] leading-relaxed mb-8 max-w-[200px]">
              Wear your aura. Born in Lagos, worn worldwide.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    s.id === 'wa'
                      ? 'Chat with us on WhatsApp'
                      : `Follow us on ${s.label}`
                  }
                  className="w-8 h-8 flex items-center justify-center border border-primary-foreground/15 text-primary-foreground/40 hover:border-accent hover:text-accent transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns — 4-col sub-grid */}
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-8">
            {navColumns.map((col) => (
              <NavColumn
                key={col.id}
                column={col}
                open={openColumn === col.id}
                onToggle={() =>
                  setOpenColumn((prev) => (prev === col.id ? null : col.id))
                }
              />
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-primary-foreground/10 py-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: payment badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {paymentMethods.map((p) => (
              <PaymentBadge key={p} label={p} />
            ))}
          </div>

          {/* Right: currency + copyright + back-to-top */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Currency selector */}
            {/* <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Select currency"
              className="bg-transparent border border-primary-foreground/15 text-primary-foreground/45 text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1.5 cursor-pointer hover:border-accent hover:text-accent transition-all duration-200 focus:outline-none"
            >
              {currencies.map((c) => (
                <option key={c} value={c} className="bg-[#111111] text-white">
                  {c}
                </option>
              ))}
            </select> */}

            {/* Copyright */}
            <p className="text-primary-foreground/30 text-[0.62rem] tracking-[0.1em]">
              © {new Date().getFullYear()} AuraFume. All rights reserved.
            </p>

            {/* Back to top */}
            <button
              onClick={backToTop}
              aria-label="Back to top"
              className="group flex items-center gap-2 text-primary-foreground/35 hover:text-accent text-[0.6rem] tracking-[0.2em] uppercase transition-colors duration-200"
            >
              Back to top
              <span className="w-6 h-6 flex items-center justify-center border border-primary-foreground/15 group-hover:border-accent transition-all duration-200">
                <ArrowUp size={11} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
