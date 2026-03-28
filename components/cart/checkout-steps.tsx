'use client';

import { Check } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  { label: 'Cart'     },
  { label: 'Delivery' },
  { label: 'Payment'  },
  { label: 'Confirm'  },
] as const;

interface CheckoutStepsProps {
  /** 0 = Cart · 1 = Delivery · 2 = Payment · 3 = Confirmation */
  currentStep?: number;
}

export default function CheckoutSteps({ currentStep = 0 }: CheckoutStepsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
      aria-label="Checkout progress"
    >
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive    = i === currentStep;
          const isFuture    = i > currentStep;

          return (
            <div key={step.label} className="contents">

              {/* ── Step node + label ─────────────────────────── */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">

                {/* Node */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.07, ease: 'easeOut' }}
                  className={`w-6 h-6 flex items-center justify-center text-[0.6rem] font-semibold transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-foreground text-background'
                      : isActive
                        ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2 ring-offset-background'
                        : 'border border-border text-muted-foreground/60'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={10} strokeWidth={3} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={`text-[0.5rem] tracking-[0.2em] uppercase leading-none transition-colors duration-300 ${
                    isActive
                      ? 'text-foreground font-medium'
                      : isFuture
                        ? 'text-muted-foreground/50'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* ── Connector line (skip after last step) ─────── */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 relative h-px mt-3 mx-1.5">
                  {/* Base line */}
                  <div className="absolute inset-0 bg-border" />
                  {/* Filled segment for completed portion */}
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-foreground"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: i * 0.07 + 0.15, ease: 'easeOut' }}
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
