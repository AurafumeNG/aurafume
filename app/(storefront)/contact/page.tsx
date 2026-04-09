import ContactPageHeader   from '@/components/contact-page-header';
import ContactOptionsBlock from '@/components/contact-options-block';
import ContactForm         from '@/components/contact-form';
import FaqCallout          from '@/components/faq-callout';
import ContactMapEmbed     from '@/components/contact-map-embed';

export const metadata = {
  title: 'Contact Us | AuraFume',
  description:
    'Get in touch with AuraFume. Reach us by email, WhatsApp, or visit our store at Balogun Tradefair Complex, Lagos.',
};

export default function ContactPage() {
  return (
    <>
      <ContactPageHeader />
      <ContactOptionsBlock />
      <ContactForm />
      <FaqCallout />
      <ContactMapEmbed />
    </>
  );
}
