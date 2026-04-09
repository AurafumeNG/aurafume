'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import CollectionsFilterBar, { type CollectionFilterId } from '@/components/shop/collections-filter-bar';
import type { CollectionSummary } from '@/app/api/collections/route';

// ── Skeleton card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-card aspect-4/5 w-full" />
      <div className="pt-3 space-y-2">
        <div className="h-3.5 w-3/4 bg-card rounded-sm" />
        <div className="h-2.5 w-full bg-card rounded-sm" />
      </div>
    </div>
  );
}

// ── Collection card ───────────────────────────────────────────────────
function CollectionCard({
  collection,
  index,
}: {
  collection: CollectionSummary;
  index: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: index * 0.045 }}
      className="group"
    >
      <Link href={collection.href} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-card aspect-4/5">
          {collection.image ? (
            <Image
              src={collection.image}
              alt={collection.name}
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            /* Placeholder when no product image exists yet */
            <div className="absolute inset-0 bg-card flex items-center justify-center">
              <span className="text-[0.55rem] tracking-[0.2em] uppercase text-muted-foreground/40">
                {collection.name}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

          {/* Featured badge */}
          {collection.featured && (
            <span className="absolute top-3 left-3 text-[0.52rem] tracking-[0.18em] uppercase px-2.5 py-1 bg-accent text-accent-foreground z-10">
              Featured
            </span>
          )}

          {/* Item count */}
          <span className="absolute bottom-3 left-3 text-[0.55rem] tracking-[0.16em] uppercase text-white/70 z-10">
            {collection.itemCount} {collection.itemCount === 1 ? 'piece' : 'pieces'}
          </span>

          {/* Hover gold border inset */}
          <span className="pointer-events-none absolute inset-0 border border-transparent group-hover:border-accent/60 transition-colors duration-300 z-10" />
        </div>

        {/* Text */}
        <div className="pt-3 space-y-1">
          <h3 className="font-heading text-[0.95rem] text-foreground leading-snug group-hover:text-accent transition-colors duration-200">
            {collection.name}
          </h3>
          <p className="text-[0.7rem] text-muted-foreground leading-relaxed line-clamp-1">
            {collection.description}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  return (
    <Suspense>
      <CollectionsPageInner />
    </Suspense>
  );
}

function CollectionsPageInner() {
  const [activeFilter, setActiveFilter] = useState<CollectionFilterId>('all');
  const [allCollections, setAllCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setAllCollections(json.data as CollectionSummary[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (activeFilter === 'all') return allCollections;
    return allCollections.filter(c => c.id === activeFilter);
  }, [activeFilter, allCollections]);

  const activeLabel = activeFilter === 'all'
    ? 'All Collections'
    : allCollections.find(c => c.id === activeFilter)?.name ?? 'Collections';

  return (
    <div className="min-h-screen bg-background">

      {/* Filter bar */}
      <CollectionsFilterBar active={activeFilter} onSelect={setActiveFilter} />

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-[0.58rem] tracking-[0.22em] uppercase text-muted-foreground mb-1">
              Aurafümeng
            </p>
            <h1 className="font-heading text-[clamp(1.4rem,4vw,2.2rem)] text-foreground leading-none">
              {activeLabel}
            </h1>
          </div>

          {!loading && (
            <span className="text-[0.68rem] tracking-[0.14em] text-muted-foreground tabular-nums pb-0.5">
              {visible.length} {visible.length === 1 ? 'collection' : 'collections'}
            </span>
          )}
        </motion.div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visible.length > 0 ? (
              <motion.div
                key={activeFilter}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8"
              >
                {visible.map((collection, i) => (
                  <CollectionCard key={collection.id} collection={collection} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-3 text-center"
              >
                <p className="text-[0.65rem] tracking-[0.22em] uppercase text-muted-foreground">
                  No collections found
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-[0.65rem] tracking-[0.18em] uppercase text-accent underline-offset-4 hover:underline"
                >
                  View all collections
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
