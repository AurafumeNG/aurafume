'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const COLLAPSED_LINES = 4; // approximate character threshold
const CHAR_THRESHOLD  = 280;

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > CHAR_THRESHOLD;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        About This Fragrance
      </h3>

      <div className="relative">
        {/* Text container */}
        <motion.div
          animate={{ height: expanded || !isLong ? 'auto' : `${COLLAPSED_LINES * 1.7}rem` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <p className="text-[0.88rem] text-foreground/80 leading-[1.75] whitespace-pre-line">
            {description}
          </p>
        </motion.div>

        {/* Fade-out gradient when collapsed */}
        <AnimatePresence>
          {isLong && !expanded && (
            <motion.div
              key="fade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Toggle button */}
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 flex items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase text-accent hover:text-foreground transition-colors"
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="inline-block"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
          {expanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </motion.section>
  );
}
