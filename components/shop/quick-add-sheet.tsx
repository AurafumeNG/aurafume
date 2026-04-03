'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from './cart-context';

// Minimal product shape the sheet needs — ShopProduct satisfies this automatically.
export interface QuickAddProduct {
  id: string;
  name: string;
  scentFamily: string;
  image: string;
  href: string;
  price: number;
  sizes: string[];
}

interface QuickAddSheetProps {
  product: QuickAddProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddSheet({ product, isOpen, onClose }: QuickAddSheetProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  // Reset sheet state when a new product opens
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[1] ?? product.sizes[0] ?? '');
      setQty(1);
      setConfirmed(false);
    }
  }, [product]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleAdd() {
    if (!product || !selectedSize || confirmed) return;
    addToCart({
      productId:    product.id,
      slug:         product.href.replace('/shop/', ''),
      name:         product.name,
      scentFamily:  product.scentFamily,
      image:        product.image,
      size:         selectedSize,
      pricePerUnit: product.price,
      qty,
    });
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 1400);
  }

  const total = product ? product.price * qty : 0;

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="qs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="qs-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border rounded-t-2xl overflow-hidden max-h-[85dvh] flex flex-col sm:max-w-sm sm:left-auto sm:right-6 sm:bottom-6 sm:rounded-2xl sm:border sm:shadow-2xl"
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={17} strokeWidth={1.8} />
            </button>

            {/* Product preview */}
            <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-border">
              <div className="relative w-16 h-20 shrink-0 overflow-hidden bg-card">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  {product.scentFamily}
                </p>
                <h3 className="font-heading text-[0.95rem] text-foreground leading-snug line-clamp-2">
                  {product.name}
                </h3>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">

              {/* Size selector */}
              <div>
                <p className="text-[0.6rem] tracking-[0.25em] uppercase text-muted-foreground mb-3">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-9 px-4 text-[0.65rem] tracking-[0.18em] uppercase border transition-all duration-150 ${
                        selectedSize === size
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div>
                <p className="text-[0.6rem] tracking-[0.25em] uppercase text-muted-foreground mb-3">
                  Quantity
                </p>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center border border-border text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    <Minus size={13} strokeWidth={2} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center border-t border-b border-border text-[0.88rem] font-medium tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center border border-border text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    <Plus size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-border space-y-3 bg-background">
              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] text-muted-foreground tracking-wide">Total</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[0.92rem] font-medium text-foreground tabular-nums"
                  >
                    ₦{total.toLocaleString('en-NG')}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAdd}
                disabled={!selectedSize}
                className={`w-full h-12 flex items-center justify-center gap-2.5 text-[0.7rem] tracking-[0.22em] uppercase font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                  confirmed
                    ? 'bg-foreground text-background'
                    : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <AnimatePresence mode="wait">
                  {confirmed ? (
                    <motion.span
                      key="confirmed"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      Added to Bag
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag size={14} />
                      Add to Bag
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* View full details */}
              <Link
                href={product.href}
                onClick={onClose}
                className="flex items-center justify-center w-full h-9 text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                View Full Details
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
