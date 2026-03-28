import { motion } from 'motion/react';

interface OccasionTagsProps {
  occasions: string[];
}

export default function OccasionTags({ occasions }: OccasionTagsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Mood &amp; Occasion
      </h3>

      {/* Horizontally scrollable pill row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {occasions.map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
            className="inline-flex shrink-0 items-center h-8 px-4 border border-border text-[0.62rem] tracking-[0.18em] uppercase text-foreground/70 hover:border-foreground hover:text-foreground transition-colors cursor-default"
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
