// Single source of truth for wholesale contact details.
// Used by the homepage banner, the /wholesale page, the announcement strip and FAQs.

export const WHOLESALE_PHONE_DISPLAY = '+234 701 400 6235';
export const WHOLESALE_PHONE_TEL     = 'tel:+2347014006235';

export const WHOLESALE_EMAIL = 'aurafumeng@gmail.com';

const EMAIL_SUBJECT = 'Wholesale Enquiry';
const EMAIL_BODY =
  'Hello AuraFume,\n\n' +
  "I'm interested in buying wholesale.\n\n" +
  'Business name:\n' +
  'Location:\n' +
  'Products / quantities of interest:\n\n' +
  'Thank you.';

export const WHOLESALE_MAILTO =
  `mailto:${WHOLESALE_EMAIL}` +
  `?subject=${encodeURIComponent(EMAIL_SUBJECT)}` +
  `&body=${encodeURIComponent(EMAIL_BODY)}`;
