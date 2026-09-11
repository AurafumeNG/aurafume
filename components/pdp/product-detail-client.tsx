'use client';

import { useState, useRef } from 'react';
import PDPNavBar from '@/components/pdp-navbar';
import ImageGallery from '@/components/pdp/image-gallery';
import ProductIdentity from '@/components/pdp/product-identity';
import VariantSelector from '@/components/pdp/variant-selector';
import QuantitySelector from '@/components/pdp/quantity-selector';
import ActionButtons from '@/components/pdp/action-buttons';
import PreviewActionButtons from '@/components/pdp/preview-action-buttons';
import PreviewBanner from '@/components/pdp/preview-banner';
import TrustBadges from '@/components/pdp/trust-badges';
import ScentNotesSection from '@/components/pdp/scent-notes';
import ProductDescription from '@/components/pdp/product-description';
import FragranceSpecsSection from '@/components/pdp/fragrance-specs';
import RelatedProducts from '@/components/pdp/related-products';
import CompleteTheSet from '@/components/pdp/complete-the-set';
import StickyActionBar from '@/components/pdp/sticky-action-bar';
import type { PDPProduct, RelatedProduct } from '@/components/pdp/types';

interface ProductDetailClientProps {
  product: PDPProduct;
  productId: string;
  isPreview: boolean;
  relatedProducts: RelatedProduct[];
  bundleProducts: RelatedProduct[];
}

export default function ProductDetailClient({
  product,
  productId,
  isPreview,
  relatedProducts,
  bundleProducts,
}: ProductDetailClientProps) {
  const firstInStockIdx = product.variants.findIndex((v) => v.stock > 0);
  const [variantIndex, setVariantIndex] = useState(
    firstInStockIdx >= 0 ? firstInStockIdx : 0,
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const actionButtonsRef = useRef<HTMLDivElement>(null);

  const clampedIdx = Math.min(variantIndex, product.variants.length - 1);
  const selectedVariant = product.variants[clampedIdx];

  function handleVariantChange(index: number) {
    setVariantIndex(index);
    setQuantity(1);
  }

  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://aurafume.ng/shop/${product.slug}`;

  // In preview mode: content is shifted down by navbar (h-14) + banner (h-12)
  const previewPaddingTop = isPreview ? 'pt-[6.5rem]' : '';

  return (
    <>
      {isPreview && (
        <PreviewBanner productId={productId} productSlug={product.slug} />
      )}

      <PDPNavBar
        wishlisted={wishlisted}
        onWishlistToggle={() => setWishlisted((v) => !v)}
        productName={product.name}
        productUrl={pageUrl}
      />

      <div className={`min-h-screen bg-background ${previewPaddingTop}`}>
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
            <ProductIdentity
              scentFamily={product.scentFamily}
              name={product.name}
              descriptor={product.descriptor}
              price={selectedVariant.price}
            />

            <div className="h-px bg-border" />

            <VariantSelector
              variants={product.variants}
              selectedIndex={clampedIdx}
              onChange={handleVariantChange}
            />

            {selectedVariant.stock > 0 && (
              <QuantitySelector
                value={quantity}
                max={selectedVariant.stock}
                onChange={setQuantity}
              />
            )}

            <div ref={actionButtonsRef}>
              {isPreview ? (
                <PreviewActionButtons />
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* ── Below-fold sections ─────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8 py-10 space-y-10">
          <TrustBadges />
          <ScentNotesSection notes={product.scentNotes} />
          <ProductDescription description={product.description} />
          <FragranceSpecsSection
            specs={product.specs}
            bottleSizes={product.variants.map((v) => v.size)}
          />
          {!isPreview && (
            <>
              <CompleteTheSet
                mainProduct={product}
                bundleProducts={bundleProducts}
              />
              <RelatedProducts products={relatedProducts} />
            </>
          )}
        </div>
      </div>

      {!isPreview && (
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
      )}
    </>
  );
}
