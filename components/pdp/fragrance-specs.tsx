import { motion } from 'motion/react';
import type { FragranceSpecs } from './types';

interface FragranceSpecsProps {
  specs: FragranceSpecs;
  bottleSizes: string[];
}

export default function FragranceSpecsSection({ specs, bottleSizes }: FragranceSpecsProps) {
  const rows = [
    { label: 'Gender',        value: specs.gender                    },
    { label: 'Concentration', value: specs.concentration             },
    { label: 'Bottle Size',   value: bottleSizes.join(' · ')        },
    { label: 'Origin',        value: specs.origin                   },
    { label: 'Longevity',     value: specs.longevity                },
    { label: 'Sillage',       value: specs.sillage                  },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Fragrance Details
      </h3>

      <div className="divide-y divide-border border border-border">
        {rows.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-baseline justify-between gap-6 px-4 py-3"
          >
            <span className="text-[0.62rem] tracking-[0.18em] uppercase text-muted-foreground shrink-0">
              {label}
            </span>
            <span className="text-[0.82rem] text-foreground text-right">
              {value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
