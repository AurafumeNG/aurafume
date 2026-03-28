import Link from 'next/link';

export default function TermsConsent() {
  return (
    <p className="text-center text-[0.62rem] tracking-[0.03em] text-muted-foreground/70 leading-relaxed">
      By placing your order, you agree to our{' '}
      <Link href="/terms"   className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
      {' · '}
      <Link href="/privacy" className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
      {' · '}
      <Link href="/refunds" className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
    </p>
  );
}
