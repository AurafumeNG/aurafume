const TOC_ITEMS = [
  { href: '#acceptance',      label: 'Acceptance of Terms'     },
  { href: '#use',             label: 'Use of the Website'      },
  { href: '#account',         label: 'Account Registration'    },
  { href: '#products',        label: 'Products & Pricing'      },
  { href: '#orders',          label: 'Orders & Payments'       },
  { href: '#shipping',        label: 'Shipping & Delivery'     },
  { href: '#returns',         label: 'Returns & Refunds'       },
  { href: '#ip',              label: 'Intellectual Property'   },
  { href: '#liability',       label: 'Limitation of Liability' },
  { href: '#law',             label: 'Governing Law'           },
  { href: '#changes',         label: 'Changes to Terms'        },
] as const;

export default function TermsToc() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-14">
      <div className="max-w-3xl mx-auto border border-border/50 p-8">
        <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-6">
          Contents
        </p>
        <ol className="space-y-3">
          {TOC_ITEMS.map(({ href, label }, i) => (
            <li key={href} className="flex items-baseline gap-3">
              <span className="text-[0.55rem] tabular-nums text-muted-foreground/30 w-4 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <a
                href={href}
                className="text-[0.75rem] tracking-wide text-muted-foreground hover:text-accent transition-colors duration-150"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
