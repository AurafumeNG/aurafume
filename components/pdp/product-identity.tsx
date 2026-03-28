'use client';

import { motion } from 'motion/react';

interface ProductIdentityProps {
  scentFamily: string;
  name: string;
  descriptor: string;
  price: number;
}

export default function ProductIdentity({
  scentFamily,
  name,
  descriptor,
  price,
}: ProductIdentityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* Scent family tag */}
      <p className="text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground">
        {scentFamily}
      </p>

      {/* Product name */}
      <h2 className="font-heading text-[clamp(1.75rem,5vw,2.5rem)] text-foreground leading-tight">
        {name}
      </h2>

      {/* One-liner descriptor */}
      <p className="text-[0.85rem] text-muted-foreground italic leading-relaxed">
        {descriptor}
      </p>

      {/* Price */}
      <motion.p
        key={price}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-[1.4rem] font-medium text-foreground tabular-nums tracking-tight"
      >
        ₦{price.toLocaleString('en-NG')}
      </motion.p>
    </motion.div>
  );
}
