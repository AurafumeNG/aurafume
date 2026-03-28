import type { ViewMode } from './types';

export default function SkeletonCard({ viewMode = 'grid' }: { viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 sm:gap-6 bg-card border border-border/50 animate-pulse">
        <div className="shrink-0 w-28 sm:w-36 aspect-[3/4] bg-muted" />
        <div className="flex flex-col justify-between py-4 pr-4 flex-1">
          <div className="space-y-2.5">
            <div className="h-2 w-20 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-2 w-24 bg-muted rounded" />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[3/4] bg-muted w-full" />
      {/* Text lines */}
      <div className="pt-3.5 space-y-2">
        <div className="h-2 w-20 bg-muted rounded" />
        <div className="flex justify-between items-center gap-2">
          <div className="h-3.5 w-28 bg-muted rounded" />
          <div className="h-3.5 w-14 bg-muted rounded" />
        </div>
        <div className="h-2 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}
