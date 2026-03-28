'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-4xl font-heading text-foreground">You&apos;re offline</h1>
        <p className="text-muted-foreground text-lg">
          Check your connection and try again. Some content may still be available from cache.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
