import { ShoppingBag, Zap } from 'lucide-react';

/**
 * Non-interactive placeholder for ActionButtons shown in preview mode.
 * The buttons are rendered identically to the real ones but are fully
 * disabled and labelled "(Preview Mode)" so admins know they can't purchase.
 */
export default function PreviewActionButtons() {
  return (
    <div className="flex flex-col gap-3">

      {/* Add to Cart — disabled */}
      <button
        type="button"
        disabled
        className="relative w-full h-14 flex items-center justify-center gap-2.5 text-[0.72rem] tracking-[0.25em] uppercase font-medium bg-muted text-muted-foreground cursor-not-allowed"
        title="Purchase actions are disabled in preview mode"
      >
        <ShoppingBag size={16} strokeWidth={1.8} />
        Add to Cart
        <span
          className="ml-1 text-[0.55rem] tracking-[0.10em] normal-case opacity-60"
          style={{ fontVariantCaps: 'normal' }}
        >
          (Preview Mode)
        </span>
      </button>

      {/* Buy Now — disabled */}
      <button
        type="button"
        disabled
        className="w-full h-14 flex items-center justify-center gap-2.5 text-[0.72rem] tracking-[0.25em] uppercase font-medium border border-border text-foreground/20 cursor-not-allowed"
        title="Purchase actions are disabled in preview mode"
      >
        <Zap size={15} strokeWidth={1.8} />
        Buy Now
        <span
          className="ml-1 text-[0.55rem] tracking-[0.10em] normal-case opacity-60"
          style={{ fontVariantCaps: 'normal' }}
        >
          (Preview Mode)
        </span>
      </button>

    </div>
  );
}
