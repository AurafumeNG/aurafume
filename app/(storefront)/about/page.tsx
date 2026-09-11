import connectDB        from '@/lib/mongodb';
import ProductModel     from '@/models/Product';
import UserModel        from '@/models/User';
import AboutHero        from '@/components/about-hero';
import AboutBrandStory  from '@/components/about-brand-story';
import AboutBrandValues from '@/components/about-brand-values';
import AboutTimeline    from '@/components/about-timeline';
import AboutSocialProof from '@/components/about-social-proof';
import AboutCta         from '@/components/about-cta';

export const revalidate = 60;

export const metadata = {
  title: 'Our Story | AuraFume',
  description:
    'Born in Lagos in 2020, AuraFume was built on one belief: luxury fragrance should be accessible to everyone. Discover our story, values, and journey.',
};

/** Real counts behind the social-proof band — zeroes render honestly if the DB is unreachable. */
async function getSocialProofStats() {
  try {
    await connectDB();
    const [productCount, customerCount] = await Promise.all([
      ProductModel.countDocuments({ status: 'published', visibleInShop: true }),
      UserModel.countDocuments({ role: 'customer' }),
    ]);
    return { productCount, customerCount };
  } catch {
    return { productCount: 0, customerCount: 0 };
  }
}

export default async function AboutPage() {
  const stats = await getSocialProofStats();

  return (
    <>
      <AboutHero />
      <AboutBrandStory />
      <AboutBrandValues />
      <AboutTimeline />
      <AboutSocialProof stats={stats} />
      <AboutCta />
    </>
  );
}
