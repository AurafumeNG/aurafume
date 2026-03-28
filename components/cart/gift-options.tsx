'use client';

import { Gift, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';

// ── Reusable checkbox ──────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center border transition-colors ${
          checked
            ? 'bg-foreground border-foreground'
            : 'border-border group-hover:border-foreground/40'
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={9} strokeWidth={3} className="text-background" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-[0.75rem] text-foreground leading-snug">{label}</span>
        {sublabel && (
          <p className="text-[0.62rem] tracking-[0.02em] text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
    </label>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-9 h-5 transition-colors duration-300 ${
        checked ? 'bg-foreground' : 'bg-border'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`absolute top-0.5 w-4 h-4 bg-background ${
          checked ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function GiftOptions() {
  const { giftOptions, setGiftOptions } = useCart();
  const { isGift, message, wrapping, hidePrice } = giftOptions;

  return (
    <section>
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={13} strokeWidth={1.8} className="text-muted-foreground" />
          <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
            Gift Options
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[0.68rem] text-foreground/70">
            {isGift ? 'Yes, this is a gift' : 'This is a gift'}
          </span>
          <Toggle checked={isGift} onChange={v => setGiftOptions({ isGift: v })} />
        </div>
      </div>

      {/* Expandable gift panel */}
      <AnimatePresence initial={false}>
        {isGift && (
          <motion.div
            key="gift-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">

              {/* Gift message */}
              <div>
                <label
                  htmlFor="gift-message"
                  className="block text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5"
                >
                  Personal Message
                  <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="gift-message"
                  rows={3}
                  value={message}
                  onChange={e => setGiftOptions({ message: e.target.value })}
                  maxLength={200}
                  placeholder="Add a personal message for the recipient…"
                  className="w-full px-3 py-2.5 border border-border bg-background text-[0.78rem] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/40 resize-none transition-colors"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[0.56rem] tracking-[0.1em] tabular-nums text-muted-foreground/60">
                    {message.length}/200
                  </span>
                </div>
              </div>

              {/* Gift wrapping */}
              <div className="border border-border p-3">
                <Checkbox
                  checked={wrapping}
                  onChange={v => setGiftOptions({ wrapping: v })}
                  label="Add gift wrapping"
                  sublabel={`Elegant ribbon & tissue wrap — +₦${GIFT_WRAP_FEE.toLocaleString()}`}
                />

                {/* Wrapping preview tag */}
                <AnimatePresence>
                  {wrapping && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2.5 ml-7 flex items-center gap-1.5"
                    >
                      <span className="text-[0.6rem] tracking-[0.12em] uppercase text-accent font-medium">
                        Added to order
                      </span>
                      <span className="text-[0.66rem] font-semibold text-accent tabular-nums">
                        +₦{GIFT_WRAP_FEE.toLocaleString()}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hide price */}
              <Checkbox
                checked={hidePrice}
                onChange={v => setGiftOptions({ hidePrice: v })}
                label="Hide price from recipient"
                sublabel="Prices will not appear on the packing slip or receipt inside the box."
              />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
