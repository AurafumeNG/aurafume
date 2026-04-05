'use client';

import { useState, useRef, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
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
import type { PDPProduct } from '@/components/pdp/types';
import { Loader2 } from 'lucide-react';

// ── DB → PDPProduct conversion ─────────────────────────────────────────────────

interface DbVariant {
  size: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

interface DbProduct {
  _id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  images: { url: string; publicId: string }[];
  fragranceFamilies: string[];
  concentration: string;
  gender: string;
  origin: string;
  longevity: string;
  sillage: string;
  occasions: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  variants: DbVariant[];
  isBestSeller: boolean;
  isNewArrival: boolean;
}

function dbToPDPProduct(p: DbProduct): PDPProduct {
  let badge: PDPProduct['badge'];
  if (p.isBestSeller) badge = 'Best Seller';
  else if (p.isNewArrival) badge = 'New';
  else if (
    p.variants.some((v) => v.stock > 0 && v.stock <= v.lowStockThreshold)
  )
    badge = 'Low Stock';

  return {
    id: p._id,
    slug: p.slug,
    name: p.name,
    descriptor: p.shortDescription || p.name,
    scentFamily: p.fragranceFamilies.length
      ? p.fragranceFamilies.join(' · ')
      : 'Fragrance',
    badge,
    images: p.images.length
      ? p.images.map((i) => i.url)
      : ['/images/placeholder.jpeg'],
    variants: p.variants.map((v) => ({
      size: v.size,
      price: v.price,
      stock: v.stock,
    })),
    scentNotes: { top: p.topNotes, heart: p.heartNotes, base: p.baseNotes },
    description: p.fullDescription,
    specs: {
      gender: p.gender || '—',
      concentration: p.concentration || '—',
      origin: p.origin || '—',
      longevity: p.longevity || '—',
      sillage: p.sillage || '—',
    },
    occasions: p.occasions,
    relatedSlugs: [],
    bundleSlugs: [],
  };
}

// ── Inner page (needs useSearchParams → must be inside Suspense) ───────────────

function ProductDetailContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // ── All hooks unconditionally at the top ───────────────────────────────────

  const [product, setProduct] = useState<PDPProduct | null>(null);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<'not-found' | 'error' | null>(
    null,
  );

  // Interactive state (starts at 0; corrected via effect once product loads)
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const actionButtonsRef = useRef<HTMLDivElement>(null);

  // Fetch product from API (works for both preview and live)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/admin/products/by-slug/${slug}`);
        if (res.status === 404) {
          if (!cancelled) setFetchError('not-found');
          return;
        }
        if (!res.ok) {
          if (!cancelled) setFetchError('error');
          return;
        }
        const json = (await res.json()) as {
          success?: boolean;
          data?: DbProduct;
        };
        if (!cancelled && json.data) {
          setProductId(json.data._id);
          const converted = dbToPDPProduct(json.data);
          setProduct(converted);
          const idx = converted.variants.findIndex((v) => v.stock > 0);
          setVariantIndex(idx >= 0 ? idx : 0);
        }
      } catch {
        if (!cancelled) setFetchError('error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Conditional renders (after all hooks) ──────────────────────────────────

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#0F0F0F' }}
      >
        <Loader2
          size={22}
          strokeWidth={1.6}
          className="animate-spin text-foreground/40"
        />
      </div>
    );
  }

  if (fetchError === 'not-found') notFound();
  if (fetchError === 'error' || !product) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load product.</p>
      </div>
    );
  }

  const safeProduct = product!;
  const clampedIdx = Math.min(variantIndex, safeProduct.variants.length - 1);
  const selectedVariant = safeProduct.variants[clampedIdx];

  function handleVariantChange(index: number) {
    setVariantIndex(index);
    setQuantity(1);
  }

  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://aurafume.ng/shop/${slug}`;

  // In preview mode: content is shifted down by navbar (h-14 = 3.5rem) + banner (h-12 = 3rem)
  const previewPaddingTop = isPreview ? 'pt-[6.5rem]' : '';

  return (
    <>
      {/* Preview banner — sits below the fixed PDPNavBar */}
      {isPreview && <PreviewBanner productId={productId} productSlug={slug} />}

      <PDPNavBar
        wishlisted={wishlisted}
        onWishlistToggle={() => setWishlisted((v) => !v)}
        productName={safeProduct.name}
        productUrl={pageUrl}
      />

      <div className={`min-h-screen bg-background ${previewPaddingTop}`}>
        {/* ── Two-column layout on desktop ───────────────────────── */}
        <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-14 lg:items-start lg:px-8 lg:py-10">
          {/* Left — Gallery */}
          <div className="lg:sticky lg:top-20">
            <ImageGallery
              images={safeProduct.images}
              productName={safeProduct.name}
              badge={safeProduct.badge}
            />
          </div>

          {/* Right — Product info */}
          <div className="px-5 sm:px-8 lg:px-0 py-7 lg:py-0 space-y-7">
            {/* Identity */}
            <ProductIdentity
              scentFamily={safeProduct.scentFamily}
              name={safeProduct.name}
              descriptor={safeProduct.descriptor}
              price={selectedVariant.price}
            />

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Variant selector */}
            <VariantSelector
              variants={safeProduct.variants}
              selectedIndex={clampedIdx}
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

            {/* Action buttons */}
            <div ref={actionButtonsRef}>
              {isPreview ? (
                <PreviewActionButtons />
              ) : (
                <ActionButtons
                  productId={safeProduct.id}
                  productSlug={safeProduct.slug}
                  productName={safeProduct.name}
                  productImage={safeProduct.images[0]}
                  scentFamily={safeProduct.scentFamily}
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

          <ScentNotesSection notes={safeProduct.scentNotes} />

          <ProductDescription description={safeProduct.description} />

          <FragranceSpecsSection
            specs={safeProduct.specs}
            bottleSizes={safeProduct.variants.map((v) => v.size)}
          />

          {!isPreview && (
            <>
              <CompleteTheSet
                mainProduct={safeProduct}
                bundleSlugs={safeProduct.bundleSlugs}
              />
              <RelatedProducts slugs={safeProduct.relatedSlugs} />
            </>
          )}
        </div>
      </div>

      {/* Sticky bottom bar — hidden in preview mode */}
      {!isPreview && (
        <StickyActionBar
          price={selectedVariant.price}
          quantity={quantity}
          productId={safeProduct.id}
          productSlug={safeProduct.slug}
          productName={safeProduct.name}
          productImage={safeProduct.images[0]}
          scentFamily={safeProduct.scentFamily}
          selectedSize={selectedVariant.size}
          isOutOfStock={selectedVariant.stock === 0}
          observeRef={actionButtonsRef}
        />
      )}
    </>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  console.log('====================================');
  console.log(slug);
  console.log('====================================');
  return (
    <Suspense>
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}
