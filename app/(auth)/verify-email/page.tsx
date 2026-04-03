'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

const STATES = {
  verified: {
    Icon: CheckCircle2,
    color: 'oklch(0.72 0.10 74)',
    title: 'Email Verified',
    body: 'Your email has been verified. You can now sign in to your AuraFume account.',
    cta: { label: 'Sign In', href: '/login?verified=1' },
  },
  expired: {
    Icon: Clock,
    color: 'oklch(0.68 0.15 60)',
    title: 'Link Expired',
    body: 'This verification link has expired. Please create a new account or contact support.',
    cta: { label: 'Create Account', href: '/signup' },
  },
  invalid: {
    Icon: AlertCircle,
    color: 'oklch(0.55 0.18 25)',
    title: 'Invalid Link',
    body: 'This verification link is invalid or has already been used.',
    cta: { label: 'Create Account', href: '/signup' },
  },
  server: {
    Icon: AlertCircle,
    color: 'oklch(0.55 0.18 25)',
    title: 'Something Went Wrong',
    body: 'We could not verify your email. Please try again or contact support.',
    cta: { label: 'Try Again', href: '/signup' },
  },
} as const;

function VerifyEmailInner() {
  const params   = useSearchParams();
  const verified = params.get('verified') === '1';
  const error    = params.get('error') as keyof typeof STATES | null;

  const key = verified ? 'verified' : (error && error in STATES ? error : 'invalid');
  const { Icon, color, title, body, cta } = STATES[key];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-7 text-center py-4"
    >
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
      >
        <Icon size={44} strokeWidth={1.4} style={{ color }} />
      </motion.div>

      <div className="space-y-2.5">
        <h1 className="text-[0.65rem] tracking-[0.28em] uppercase text-foreground font-medium">{title}</h1>
        <p className="text-[0.6rem] tracking-[0.06em] leading-relaxed text-muted-foreground max-w-[260px] mx-auto">
          {body}
        </p>
      </div>

      <Link
        href={cta.href}
        className="inline-flex items-center justify-center h-12 px-10 text-[0.6rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200"
        style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
      >
        {cta.label}
      </Link>

      {key !== 'verified' && (
        <p className="text-[0.52rem] tracking-[0.1em] text-muted-foreground/50">
          Need help?{' '}
          <a href="mailto:hello@aurafume.com"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Contact support
          </a>
        </p>
      )}
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
