'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ArrowRight, RotateCcw, ChevronLeft } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
interface QuizAnswer {
  step: number;
  value: string;
}

interface QuizState {
  answers: QuizAnswer[];
  completed: boolean;
}

interface ProductResult {
  id: string;
  name: string;
  notes: string;
  price: number;
  image: string;
  href: string;
  badge?: string;
}

// ── Quiz data ───────────────────────────────────────────────────────
const steps = [
  {
    id: 'occasion',
    question: 'When do you wear fragrance most?',
    options: [
      { value: 'everyday', label: 'Everyday wear', sub: 'Subtle & effortless' },
      { value: 'evening', label: 'Evening out', sub: 'Bold & memorable' },
      { value: 'work', label: 'The office', sub: 'Refined & professional' },
      { value: 'special', label: 'Special occasions', sub: 'Unforgettable moments' },
    ],
  },
  {
    id: 'style',
    question: 'How would you describe your personal style?',
    options: [
      { value: 'classic', label: 'Timeless & classic', sub: 'Clean lines, understated' },
      { value: 'bold', label: 'Bold & expressive', sub: 'Confident, unmistakable' },
      { value: 'romantic', label: 'Romantic & soft', sub: 'Delicate, feminine' },
      { value: 'earthy', label: 'Natural & grounded', sub: 'Warm, organic' },
    ],
  },
  {
    id: 'scent',
    question: 'Which scent family draws you in?',
    options: [
      { value: 'floral', label: 'Floral', sub: 'Rose · Jasmine · Peony' },
      { value: 'woody', label: 'Woody', sub: 'Sandalwood · Cedar · Vetiver' },
      { value: 'oriental', label: 'Oriental', sub: 'Oud · Amber · Resin' },
      { value: 'fresh', label: 'Fresh', sub: 'Citrus · Green · Aqua' },
    ],
  },
  {
    id: 'who',
    question: 'Who are you shopping for?',
    options: [
      { value: 'myself-her', label: 'Myself — feminine', sub: 'For her energy' },
      { value: 'myself-him', label: 'Myself — masculine', sub: 'For his presence' },
      { value: 'gift-her', label: 'Gift — for her', sub: "She'll love it" },
      { value: 'gift-him', label: 'Gift — for him', sub: "He'll wear it always" },
    ],
  },
];

// ── Product recommendation map ──────────────────────────────────────
const allProducts: ProductResult[] = [
  {
    id: 'loving-you-frozen',
    name: 'Loving You Frozen',
    notes: 'Floral · Musky · Amber',
    price: 149500,
    image: '/images/image5.jpeg',
    href: '/shop/loving-you-frozen',
    badge: 'Best Seller',
  },
  {
    id: 'stronger-intense',
    name: 'Stronger For You Intense',
    notes: 'Woody · Spicy · Warm',
    price: 175000,
    image: '/images/image3.jpeg',
    href: '/shop/stronger-for-you-intense',
    badge: 'Best Seller',
  },
  {
    id: 'stronger-absolute',
    name: 'Stronger For You Absolute',
    notes: 'Oriental · Resinous · Bold',
    price: 185000,
    image: '/images/image11.jpeg',
    href: '/shop/stronger-for-you-absolute',
    badge: 'New',
  },
  {
    id: 'suger-edp',
    name: 'Suger EDP',
    notes: 'Fresh · Green · Earthy',
    price: 139500,
    image: '/images/image1.jpeg',
    href: '/shop/suger-edp',
    badge: 'Best Seller',
  },
  {
    id: 'read-lux',
    name: "Re'ad Lux",
    notes: 'Citrus · Floral · Musk',
    price: 195000,
    image: '/images/image7.jpeg',
    href: '/shop/read-lux',
    badge: 'New',
  },
  {
    id: 'al-oud',
    name: 'Al Oud',
    notes: 'Oud · Resinous · Smoky',
    price: 210000,
    image: '/images/image8.jpeg',
    href: '/shop/al-oud',
    badge: 'Best Seller',
  },
];

function getRecommendations(answers: QuizAnswer[]): ProductResult[] {
  const map: Record<string, string[]> = {
    scent_floral: ['loving-you-frozen', 'read-lux'],
    scent_woody: ['stronger-intense', 'suger-edp'],
    scent_oriental: ['al-oud', 'stronger-absolute'],
    scent_fresh: ['suger-edp', 'read-lux'],
  };

  const scentAnswer = answers.find((a) => a.step === 2);
  const key = scentAnswer ? `scent_${scentAnswer.value}` : null;
  const ids = key && map[key] ? map[key] : ['loving-you-frozen', 'stronger-intense'];
  return ids.map((id) => allProducts.find((p) => p.id === id)!).filter(Boolean);
}

// ── Storage helpers ─────────────────────────────────────────────────
const STORAGE_KEY = 'scent-quiz-v1';

function loadState(): QuizState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizState) : null;
  } catch {
    return null;
  }
}

function saveState(state: QuizState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Result card ─────────────────────────────────────────────────────
function ResultCard({ product }: { product: ProductResult }) {
  return (
    <Link href={product.href} className="group flex flex-col">
      <div className="relative overflow-hidden bg-card aspect-3/4">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 220px"
        />
        {product.badge && (
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[0.58rem] tracking-[0.18em] uppercase px-2.5 py-1">
            {product.badge}
          </span>
        )}
      </div>
      <div className="pt-4 flex flex-col gap-1">
        <p className="text-muted-foreground text-[0.62rem] tracking-[0.2em] uppercase">
          {product.notes}
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-heading text-base text-foreground leading-snug">{product.name}</h4>
          <span className="text-sm text-foreground/80 shrink-0">
            ₦{product.price.toLocaleString('en-NG')}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Quiz Modal ──────────────────────────────────────────────────────
function QuizModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [completed, setCompleted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setAnswers(saved.answers);
      if (saved.completed) {
        setCompleted(true);
      } else {
        setCurrentStep(saved.answers.length);
      }
    }
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSelect = useCallback((value: string) => {
    if (animating) return;
    const newAnswer: QuizAnswer = { step: currentStep, value };
    const newAnswers = [...answers, newAnswer];

    setLeaving(true);
    setTimeout(() => {
      setAnswers(newAnswers);

      if (currentStep + 1 >= steps.length) {
        setCompleted(true);
        saveState({ answers: newAnswers, completed: true });
      } else {
        setCurrentStep(currentStep + 1);
        saveState({ answers: newAnswers, completed: false });
      }

      setLeaving(false);
      setAnimating(false);
    }, 250);

    setAnimating(true);
  }, [animating, answers, currentStep]);

  function handleBack() {
    if (currentStep === 0 || animating) return;
    setLeaving(true);
    setTimeout(() => {
      const newAnswers = answers.slice(0, -1);
      setAnswers(newAnswers);
      setCurrentStep(currentStep - 1);
      saveState({ answers: newAnswers, completed: false });
      setLeaving(false);
    }, 200);
  }

  function handleRetake() {
    clearState();
    setAnswers([]);
    setCurrentStep(0);
    setCompleted(false);
  }

  const recommendations = completed ? getRecommendations(answers) : [];
  const progress = completed ? 100 : (currentStep / steps.length) * 100;
  const step = steps[currentStep];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-130 bg-background flex flex-col max-h-[92svh] sm:max-h-[88vh] overflow-hidden sm:rounded-sm shadow-2xl">

          {/* Progress bar */}
          <div className="h-0.5 bg-border shrink-0">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              {!completed && currentStep > 0 && (
                <button
                  onClick={handleBack}
                  aria-label="Previous question"
                  className="text-foreground/40 hover:text-foreground transition-colors -ml-1"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <p className="font-heading text-sm text-foreground">
                {completed ? 'Your Matches' : `Question ${currentStep + 1} of ${steps.length}`}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close quiz"
              className="text-foreground/40 hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div
            className={`flex-1 overflow-y-auto transition-opacity duration-200 ${leaving ? 'opacity-0' : 'opacity-100'}`}
          >
            {!completed ? (
              <div className="px-6 py-8">
                <h3 className="font-heading text-[clamp(1.35rem,3vw,1.65rem)] text-foreground leading-tight mb-8">
                  {step.question}
                </h3>
                <div className="flex flex-col gap-3">
                  {step.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className="group flex items-center justify-between gap-4 px-5 py-4 border border-border hover:border-accent text-left transition-all duration-200 hover:bg-accent/5"
                    >
                      <div>
                        <p className="text-[0.88rem] text-foreground font-medium leading-snug group-hover:text-accent transition-colors">
                          {opt.label}
                        </p>
                        <p className="text-[0.72rem] text-muted-foreground mt-0.5">{opt.sub}</p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-foreground/20 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-8">
                <p className="text-accent text-[0.6rem] tracking-[0.3em] uppercase mb-2">
                  Curated for you
                </p>
                <h3 className="font-heading text-[clamp(1.35rem,3vw,1.65rem)] text-foreground leading-tight mb-8">
                  Your signature scents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {recommendations.map((p) => (
                    <ResultCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-border shrink-0 flex flex-col gap-3">
            {completed ? (
              <>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="w-full flex items-center justify-center py-3.5 bg-primary text-primary-foreground text-[0.68rem] tracking-[0.2em] uppercase transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Shop These Scents
                </Link>
                <button
                  onClick={handleRetake}
                  className="flex items-center justify-center gap-2 text-[0.68rem] text-muted-foreground hover:text-foreground tracking-[0.18em] uppercase transition-colors"
                >
                  <RotateCcw size={11} />
                  Retake Quiz
                </button>
              </>
            ) : (
              <p className="text-center text-[0.62rem] text-muted-foreground tracking-[0.15em] uppercase">
                {steps.length - currentStep} question{steps.length - currentStep !== 1 ? 's' : ''} left
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Banner pill ─────────────────────────────────────────────────────
const scentPills = ['Floral', 'Woody', 'Oriental'];

// ── Main component ──────────────────────────────────────────────────
export default function ScentFinder() {
  const [modalOpen, setModalOpen] = useState(false);
  const [hasState, setHasState] = useState(false);

  useEffect(() => {
    const saved = loadState();
    setHasState(!!saved);
  }, [modalOpen]);

  return (
    <>
      <section className="relative bg-primary overflow-hidden py-24 md:py-32">

        {/* Fine grid texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #C6A77B 1px, transparent 1px),
                              linear-gradient(to bottom, #C6A77B 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial gold glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(198,167,123,0.10) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative max-w-2xl mx-auto px-6 sm:px-10 text-center flex flex-col items-center">

          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-6">
            <span className="block h-px w-8 bg-accent shrink-0" />
            <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">
              Personalised for you
            </p>
            <span className="block h-px w-8 bg-accent shrink-0" />
          </div>

          {/* Headline */}
          <h2 className="font-heading text-[clamp(2.2rem,5vw,3.8rem)] text-primary-foreground leading-[1.05] mb-5">
            Find Your Signature<br />
            <em className="not-italic text-accent">Scent</em>
          </h2>

          {/* Descriptor */}
          <p className="text-primary-foreground/45 text-[0.9rem] leading-relaxed max-w-sm mb-9">
            Answer four quick questions and we'll match you with the fragrances made for your story.
          </p>

          {/* Scent pills */}
          <div className="flex items-center gap-2.5 mb-10">
            {scentPills.map((pill) => (
              <span
                key={pill}
                className="px-4 py-1.5 border border-accent/35 text-accent/70 text-[0.6rem] tracking-[0.22em] uppercase"
              >
                {pill}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setModalOpen(true)}
            className="group inline-flex items-center gap-3 bg-accent text-[#1a1208] px-8 py-4 text-[0.72rem] tracking-[0.25em] uppercase font-medium transition-all duration-300 hover:bg-accent/90 hover:gap-4"
          >
            {hasState ? 'Continue Quiz' : 'Start Quiz'}
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>

        </div>
      </section>

      <QuizModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
