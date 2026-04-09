const TOC_ITEMS = [
  { href: '#collect',   label: 'Information We Collect'       },
  { href: '#use',       label: 'How We Use Your Information'  },
  { href: '#share',     label: 'How We Share Your Information'},
  { href: '#storage',   label: 'Data Storage & Security'      },
  { href: '#cookies',   label: 'Cookies & Tracking'           },
  { href: '#rights',    label: 'Your Rights'                  },
  { href: '#children',  label: "Children's Privacy"           },
  { href: '#changes',   label: 'Changes to This Policy'       },
  { href: '#contact',   label: 'Contact Us'                   },
] as const;

export default function PrivacyToc() {
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
