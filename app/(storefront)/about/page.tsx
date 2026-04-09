import AboutHero        from '@/components/about-hero';
import AboutBrandStory  from '@/components/about-brand-story';
import AboutBrandValues from '@/components/about-brand-values';
import AboutTimeline    from '@/components/about-timeline';
import AboutSocialProof from '@/components/about-social-proof';
import AboutCta         from '@/components/about-cta';

export const metadata = {
  title: 'Our Story | AuraFume',
  description:
    'Born in Lagos in 2020, AuraFume was built on one belief: luxury fragrance should be accessible to everyone. Discover our story, values, and journey.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutBrandStory />
      <AboutBrandValues />
      <AboutTimeline />
      <AboutSocialProof />
      <AboutCta />
    </>
  );
}
