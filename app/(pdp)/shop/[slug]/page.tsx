'use client';

import { useState, useRef } from 'react';
import { use } from 'react';
import { notFound } from 'next/navigation';
import PDPNavBar from '@/components/pdp-navbar';
import ImageGallery from '@/components/pdp/image-gallery';
import ProductIdentity from '@/components/pdp/product-identity';
import VariantSelector from '@/components/pdp/variant-selector';
import QuantitySelector from '@/components/pdp/quantity-selector';
import ActionButtons from '@/components/pdp/action-buttons';
import { getProduct } from '@/components/pdp/product-data';
import TrustBadges from '@/components/pdp/trust-badges';
import ScentNotesSection from '@/components/pdp/scent-notes';
import ProductDescription from '@/components/pdp/product-description';
import FragranceSpecsSection from '@/components/pdp/fragrance-specs';
import OccasionTags from '@/components/pdp/occasion-tags';
import RelatedProducts from '@/components/pdp/related-products';
import CompleteTheSet from '@/components/pdp/complete-the-set';
import StickyActionBar from '@/components/pdp/sticky-action-bar';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const product = getProduct(slug);

  if (!product) notFound();

  // Default to first in-stock variant
  const defaultVariantIndex = product.variants.findIndex((v) => v.stock > 0);
  const [variantIndex, setVariantIndex] = useState(
    defaultVariantIndex >= 0 ? defaultVariantIndex : 0,
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const actionButtonsRef = useRef<HTMLDivElement>(null);

  const selectedVariant = product.variants[variantIndex];

  function handleVariantChange(index: number) {
    setVariantIndex(index);
    setQuantity(1); // reset qty when size changes
  }

  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://aurafume.ng/shop/${slug}`;

  return (
    <>
      <PDPNavBar
        wishlisted={wishlisted}
        onWishlistToggle={() => setWishlisted((v) => !v)}
        productName={product.name}
        productUrl={pageUrl}
      />

      <div className="min-h-screen bg-background">
        {/* ── Two-column layout on desktop ───────────────────────── */}
        <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-14 lg:items-start lg:px-8 lg:py-10">
          {/* Left — Gallery */}
          <div className="lg:sticky lg:top-20">
            <ImageGallery
              images={product.images}
              productName={product.name}
              badge={product.badge}
            />
          </div>

          {/* Right — Product info */}
          <div className="px-5 sm:px-8 lg:px-0 py-7 lg:py-0 space-y-7">
            {/* Identity */}
            <ProductIdentity
              scentFamily={product.scentFamily}
              name={product.name}
              descriptor={product.descriptor}
              price={selectedVariant.price}
            />

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Variant selector */}
            <VariantSelector
              variants={product.variants}
              selectedIndex={variantIndex}
              onChange={handleVariantChange}
            />

            {/* Quantity selector */}
            {selectedVariant.stock > 0 && (
              <QuantitySelector
                value={quantity}
                max={selectedVariant.stock}
                onChange={setQuantity}
              />
            )}

            {/* Action buttons — observed by StickyActionBar */}
            <div ref={actionButtonsRef}>
              <ActionButtons
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                productImage={product.images[0]}
                scentFamily={product.scentFamily}
                selectedSize={selectedVariant.size}
                quantity={quantity}
                pricePerUnit={selectedVariant.price}
                isOutOfStock={selectedVariant.stock === 0}
              />
            </div>
          </div>
        </div>

        {/* ── Below-fold sections ─────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8 py-10 space-y-10">
          <TrustBadges />

          {/* <OccasionTags occasions={product.occasions} /> */}

          <ScentNotesSection notes={product.scentNotes} />

          <ProductDescription description={product.description} />

          <FragranceSpecsSection
            specs={product.specs}
            bottleSizes={product.variants.map((v) => v.size)}
          />

          <CompleteTheSet
            mainProduct={product}
            bundleSlugs={product.bundleSlugs}
          />

          <RelatedProducts slugs={product.relatedSlugs} />
        </div>
      </div>

      {/* Sticky bottom bar — hides when main action buttons are visible */}
      <StickyActionBar
        price={selectedVariant.price}
        quantity={quantity}
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        productImage={product.images[0]}
        scentFamily={product.scentFamily}
        selectedSize={selectedVariant.size}
        isOutOfStock={selectedVariant.stock === 0}
        observeRef={actionButtonsRef}
      />
    </>
  );
}
