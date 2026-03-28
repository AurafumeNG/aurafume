import HeroSection from '@/components/hero-section';
import HeroSectionAlt from '@/components/hero-section-alt';
import FeaturedProducts from '@/components/featured-products';
import NewArrivals from '@/components/new-arrivals';
import CategoryHighlights from '@/components/category-highlights';
import BrandStory from '@/components/brand-story';
// import ProductCarousel from '@/components/product-carousel';
import ProductCarouselAlt from '@/components/product-carousel-alt';
import ScentFinder from '@/components/scent-finder';
import Testimonials from '@/components/testimonials';
import SocialFeed from '@/components/social-feed';

export default function Home() {
  return (
    <>
      {/* Option A — full-bleed cinematic */}
      <HeroSection />

      {/* Option B — split-screen editorial */}
      {/* <HeroSectionAlt /> */}

      <FeaturedProducts />
      <NewArrivals />
      <CategoryHighlights />
      <BrandStory />
      <ProductCarouselAlt />
      <ScentFinder />
      <Testimonials />
      {/* <SocialFeed /> */}
    </>
  );
}
