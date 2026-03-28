import { motion } from 'motion/react';
import type { ScentNotes } from './types';

interface ScentNotesSectionProps {
  notes: ScentNotes;
}

// Each tier narrows toward the top — pyramid effect via max-width
const TIERS = [
  {
    key: 'top'   as const,
    label: 'Top Notes',
    sub: 'First impression · fades within 15–30 min',
    maxW: 'max-w-[72%]',
    bg: 'bg-background',
    dotSize: 'w-1.5 h-1.5',
  },
  {
    key: 'heart' as const,
    label: 'Heart Notes',
    sub: 'The soul · lasts 2–4 hours',
    maxW: 'max-w-[86%]',
    bg: 'bg-card',
    dotSize: 'w-2 h-2',
  },
  {
    key: 'base'  as const,
    label: 'Base Notes',
    sub: 'The foundation · lingers longest',
    maxW: 'max-w-full',
    bg: 'bg-card',
    dotSize: 'w-2.5 h-2.5',
  },
] as const;

function NotePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-6 px-3 border border-border text-[0.6rem] tracking-[0.14em] uppercase text-foreground/70">
      {label}
    </span>
  );
}

export default function ScentNotesSection({ notes }: ScentNotesSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-5">
        Fragrance Notes
      </h3>

      {/* Pyramid stack — narrows at top, widens at base */}
      <div className="flex flex-col items-center gap-0">
        {TIERS.map(({ key, label, sub, maxW, bg, dotSize }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.1 }}
            className={`w-full ${maxW} ${bg} border border-border border-b-0 last:border-b px-5 py-4`}
          >
            {/* Tier header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`${dotSize} rounded-full bg-accent/60 shrink-0`} />
              <div>
                <p className="text-[0.65rem] tracking-[0.2em] uppercase text-foreground leading-none">
                  {label}
                </p>
                <p className="text-[0.55rem] text-muted-foreground/60 mt-0.5 leading-none">
                  {sub}
                </p>
              </div>
            </div>

            {/* Note pills */}
            <div className="flex flex-wrap gap-1.5">
              {notes[key].map(note => (
                <NotePill key={note} label={note} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
