import PrivacyPageHeader from '@/components/privacy-page-header';
import PrivacyToc        from '@/components/privacy-toc';
import PrivacyContent    from '@/components/privacy-content';

export const metadata = {
  title: 'Privacy Policy | AuraFume',
  description:
    'Learn how AuraFume collects, uses, and protects your personal data — including orders, payments, cookies, and your rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PrivacyPageHeader />
      <PrivacyToc />
      <PrivacyContent />
    </>
  );
}
