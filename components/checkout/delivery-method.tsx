'use client';

import { Check, Package, Store, Truck, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DELIVERY_OPTIONS, type DeliveryOption, useCheckout } from './checkout-context';

// ── Date helpers ───────────────────────────────────────────────────────────────

function addBusinessDays(from: Date, n: number): Date {
  if (n === 0) return new Date(from);
  const result = new Date(from);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatArrival(date: Date): string {
  const weekday = date.toLocaleDateString('en-NG', { weekday: 'long'  });
  const month   = date.toLocaleDateString('en-NG', { month:   'long'  });
  const day     = date.getDate();
  return `${weekday}, ${month} ${day}${ordinalSuffix(day)}`;
}

function arrivalLabel(option: DeliveryOption): string {
  if (option.id === 'pickup') return 'Available for collection today';
  const arrives = addBusinessDays(new Date(), option.days);
  return `Arrives by ${formatArrival(arrives)}`;
}

// ── Option icon ────────────────────────────────────────────────────────────────

function OptionIcon({ id }: { id: DeliveryOption['id'] }) {
  const cls = 'shrink-0';
  if (id === 'pickup')       return <Store       size={18} strokeWidth={1.6} className={cls} />;
  if (id === 'within-lagos') return <Truck       size={18} strokeWidth={1.6} className={cls} />;
  return                            <Package     size={18} strokeWidth={1.6} className={cls} />;
}

// ── Single option card ─────────────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option:   DeliveryOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      className={`relative cursor-pointer border-2 p-4 transition-colors duration-200 select-none ${
        selected
          ? 'border-accent bg-accent/[0.04]'
          : 'border-border hover:border-foreground/25'
      }`}
    >
      {/* Selection indicator — top right */}
      <div className={`absolute top-3.5 right-3.5 w-4 h-4 flex items-center justify-center border-2 transition-colors duration-200 ${
        selected ? 'bg-accent border-accent' : 'border-border'
      }`}>
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={9} strokeWidth={3} className="text-accent-foreground" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Main row */}
      <div className="flex items-start gap-3 pr-7">
        {/* Icon */}
        <span className={`mt-0.5 transition-colors duration-200 ${
          selected ? 'text-accent' : 'text-muted-foreground'
        }`}>
          <OptionIcon id={option.id} />
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-[0.82rem] font-medium transition-colors duration-200 ${
              selected ? 'text-foreground' : 'text-foreground/80'
            }`}>
              {option.label}
            </span>
            <span className={`text-[0.82rem] font-semibold tabular-nums shrink-0 transition-colors duration-200 ${
              selected ? 'text-accent' : 'text-foreground/70'
            }`}>
              {option.fee === 0 ? 'Free' : `₦${option.fee.toLocaleString()}`}
            </span>
          </div>
          <p className="text-[0.68rem] tracking-[0.04em] text-muted-foreground mt-0.5">
            {option.desc}
          </p>
          <p className="text-[0.64rem] tracking-[0.06em] text-muted-foreground/70 mt-0.5">
            {option.duration}
          </p>
        </div>
      </div>

      {/* Estimated arrival — slides in when selected */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key="arrival"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-accent/30">
              <CalendarCheck size={12} strokeWidth={1.8} className="text-accent shrink-0" />
              <p className="text-[0.66rem] tracking-[0.06em] text-foreground font-medium">
                {arrivalLabel(option)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function DeliveryMethod() {
  const { deliveryOption, setDeliveryOption } = useCheckout();

  return (
    <section>
      {/* Heading */}
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Delivery Method
      </h2>

      {/* Option cards */}
      <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
        {DELIVERY_OPTIONS.map(option => (
          <OptionCard
            key={option.id}
            option={option}
            selected={deliveryOption?.id === option.id}
            onSelect={() => setDeliveryOption(option)}
          />
        ))}
      </div>

      {/* No-selection prompt */}
      <AnimatePresence>
        {!deliveryOption && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[0.62rem] tracking-[0.08em] text-muted-foreground/70 mt-3 text-center"
          >
            Please select a delivery method to continue.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
