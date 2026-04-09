import TermsPageHeader from '@/components/terms-page-header';
import TermsToc        from '@/components/terms-toc';
import TermsContent    from '@/components/terms-content';

export const metadata = {
  title: 'Terms & Conditions | AuraFume',
  description:
    'Read the AuraFume Terms & Conditions covering orders, payments, shipping, returns, intellectual property, and governing law.',
};

export default function TermsPage() {
  return (
    <>
      <TermsPageHeader />
      <TermsToc />
      <TermsContent />
    </>
  );
}
