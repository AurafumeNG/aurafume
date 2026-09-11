import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import ProductModel from '@/models/Product';
import NotFoundPopularProducts, { type QuickAddProduct } from '@/components/not-found-popular-products';

export const revalidate = 60;

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Perfume bottle SVG ────────────────────────────────────────────────────────
function PerfumeBottle() {
  return (
    <svg
      viewBox="0 0 100 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-20 h-28 sm:w-24 sm:h-36"
      aria-hidden
    >
      {/* Spray arm */}
      <line x1="66" y1="35" x2="82" y2="35" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="80" y="30" width="10" height="10" rx="1.5" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" />
      {/* Spray mist */}
      <circle cx="94" cy="27" r="1.4" fill="oklch(0.72 0.10 74)" opacity="0.5" />
      <circle cx="97" cy="33" r="1"   fill="oklch(0.72 0.10 74)" opacity="0.35" />
      <circle cx="94" cy="39" r="1.4" fill="oklch(0.72 0.10 74)" opacity="0.5" />
      {/* Cap */}
      <rect x="20" y="16" width="46" height="22" rx="4" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="30" y="36" width="26" height="18" rx="2" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" />
      {/* Shoulders */}
      <path d="M12 58 L30 54 L56 54 L74 58" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Body */}
      <rect x="12" y="57" width="62" height="94" rx="6" stroke="oklch(0.72 0.10 74)" strokeWidth="1.5" />
      {/* Label plate */}
      <rect x="22" y="78" width="42" height="50" rx="2" stroke="oklch(0.72 0.10 74)" strokeWidth="1" opacity="0.35" />
      {/* Label text lines */}
      <line x1="30" y1="92"  x2="56" y2="92"  stroke="oklch(0.72 0.10 74)" strokeWidth="1"   strokeLinecap="round" opacity="0.4" />
      <line x1="34" y1="102" x2="52" y2="102" stroke="oklch(0.72 0.10 74)" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
      <line x1="36" y1="111" x2="50" y2="111" stroke="oklch(0.72 0.10 74)" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

// ── Quick links ───────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'Shop All Fragrances', href: '/shop'              },
  { label: 'New Arrivals',        href: '/shop?filter=new'   },
  { label: 'Best Sellers',        href: '/shop?filter=best'  },
  { label: 'Gift Sets',           href: '/shop?filter=gifts' },
  { label: 'Contact Support',     href: '/contact'           },
] as const;

// ── DB helpers ────────────────────────────────────────────────────────────────
type DbVariant = { size: string; price: number };
type DbImage   = { url: string };

interface DbProduct {
  _id:               { toString(): string };
  name:              string;
  slug:              string;
  fragranceFamilies: string[];
  images:            DbImage[];
  variants:          DbVariant[];
}

async function getPopularProducts(): Promise<QuickAddProduct[]> {
  try {
    await connectDB();
    const raw = await ProductModel
      .find({ status: 'published', visibleInShop: true, isBestSeller: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('name slug fragranceFamilies images variants')
      .lean();

    return (raw as unknown as DbProduct[]).map((p) => {
      const prices = p.variants.map((v) => v.price);
      return {
        id:          p._id.toString(),
        name:        p.name,
        scentFamily: p.fragranceFamilies[0] ?? 'Fragrance',
        image:       p.images[0]?.url ?? '',
        href:        `/shop/${p.slug}`,
        price:       prices.length ? Math.min(...prices) : 0,
        sizes:       p.variants.map((v) => v.size),
      };
    });
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function NotFound() {
  const products = await getPopularProducts();

  return (
    <>
      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-background">

        {/* ── Minimal header ── */}
        <header className="flex items-center justify-center h-16 border-b border-border/30 px-6 shrink-0">
          <Link href="/">
            <Image
              src="/logo/aurafumeng-logo.png"
              alt="AuraFume"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col items-center">

          {/* ── 404 Visual Block ── */}
          <section className="w-full max-w-2xl mx-auto px-6 pt-20 pb-14 flex flex-col items-center text-center">
            {/* Large 404 numeral */}
            <div className="relative mb-2 select-none">
              <span
                className="font-heading text-[8rem] sm:text-[10rem] lg:text-[12rem] leading-none tracking-tighter font-light"
                style={{
                  WebkitTextFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  backgroundImage: GOLD_GRADIENT,
                }}
              >
                404
              </span>
            </div>

            {/* Floating perfume bottle */}
            <div className="animate-float mb-8 opacity-80">
              <PerfumeBottle />
            </div>

            {/* Tagline */}
            <h1 className="font-heading text-xl sm:text-2xl tracking-widest uppercase text-foreground mb-3">
              This page seems to have evaporated&hellip;
            </h1>

            {/* Subtext */}
            <p className="text-[0.8rem] text-muted-foreground tracking-wide leading-relaxed max-w-sm">
              The fragrance you&apos;re looking for may have moved or doesn&apos;t exist.
            </p>
          </section>

          {/* ── Action Buttons ── */}
          <section className="flex flex-col sm:flex-row items-center gap-3 px-6 pb-16">
            {/* Primary — gold */}
            <Link
              href="/"
              style={{ background: GOLD_GRADIENT }}
              className="inline-flex items-center justify-center gap-2.5 h-12 px-8 text-[0.62rem] tracking-[0.25em] uppercase font-semibold text-background hover:opacity-90 transition-opacity duration-200"
            >
              Go to Homepage
              <ArrowRight size={13} strokeWidth={2} />
            </Link>

            {/* Secondary — outlined */}
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2.5 h-12 px-8 border border-border/60 text-[0.62rem] tracking-[0.25em] uppercase font-medium text-foreground hover:border-foreground/50 hover:text-foreground transition-colors duration-200"
            >
              Browse Collection
            </Link>

            {/* Tertiary — text link */}
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[0.62rem] tracking-[0.22em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 h-12 px-4"
            >
              <Search size={13} strokeWidth={1.8} />
              Search Fragrances
            </Link>
          </section>

          {/* ── Popular Products ── */}
          <div className="w-full max-w-5xl mx-auto">
            <NotFoundPopularProducts products={products} />
          </div>

          {/* ── Quick Links ── */}
          <section className="w-full max-w-2xl mx-auto px-6 py-14 border-t border-border/30">
            <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-7 text-center">
              Quick Links
            </p>
            <ul className="flex flex-col items-center gap-3.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[0.78rem] tracking-wide text-muted-foreground hover:text-accent transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span
                      className="w-3 h-px bg-muted-foreground/30 group-hover:bg-accent group-hover:w-5 transition-all duration-300"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

        </main>

        {/* ── Minimal footer ── */}
        <footer className="border-t border-border/30 py-6 flex items-center justify-center">
          <p className="text-[0.6rem] tracking-[0.1em] text-muted-foreground/30">
            © {new Date().getFullYear()} AuraFume. All rights reserved.
          </p>
        </footer>

      </div>
    </>
  );
}
