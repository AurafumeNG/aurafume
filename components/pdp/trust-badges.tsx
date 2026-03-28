import { Truck, ShieldCheck, RefreshCcw, BadgeCheck } from 'lucide-react';
import { motion } from 'motion/react';

const BADGES = [
  { icon: Truck,        label: 'Free delivery',  sub: 'Over ₦200,000'       },
  { icon: ShieldCheck,  label: 'Secure checkout', sub: '256-bit encryption'  },
  { icon: RefreshCcw,   label: 'Easy returns',   sub: '14-day window'        },
  { icon: BadgeCheck,   label: '100% Authentic',  sub: 'Officially sourced'  },
] as const;

export default function TrustBadges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="border border-border"
    >
      <div className="flex overflow-x-auto scrollbar-none divide-x divide-border">
        {BADGES.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex-1 min-w-[140px] flex flex-col items-center gap-2 px-4 py-4 text-center"
          >
            <Icon size={18} strokeWidth={1.6} className="text-accent shrink-0" />
            <div>
              <p className="text-[0.65rem] tracking-[0.15em] uppercase text-foreground leading-none mb-1">
                {label}
              </p>
              <p className="text-[0.58rem] text-muted-foreground leading-none">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
