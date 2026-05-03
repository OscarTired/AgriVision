"use client";

export function WeatherSkeleton() {
  return (
    <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden animate-fade-in">
      <div className="shimmer-bio" />
      <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="loading-skeleton h-8 w-48 rounded-lg" />
            <div className="loading-skeleton h-4 w-64 rounded" />
          </div>
          <div className="loading-skeleton w-16 h-16 rounded-full" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl">
              <div className="loading-skeleton w-10 h-10 rounded-full" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="loading-skeleton h-6 w-20 rounded" style={{ animationDelay: `${i * 100 + 50}ms` }} />
              <div className="loading-skeleton h-3 w-16 rounded" style={{ animationDelay: `${i * 100 + 100}ms` }} />
            </div>
          ))}
        </div>

        {/* Condition pill */}
        <div className="loading-skeleton h-12 w-full rounded-lg" />

        {/* Forecast grid */}
        <div className="space-y-3">
          <div className="loading-skeleton h-6 w-40 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="loading-skeleton h-32 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>

        {/* AI recommendations skeleton */}
        <div className="space-y-2 pt-2">
          <div className="loading-skeleton h-6 w-56 rounded" />
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="loading-skeleton w-5 h-5 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="loading-skeleton h-3 w-full rounded" />
              <div className="loading-skeleton h-3 w-5/6 rounded" style={{ animationDelay: '80ms' }} />
              <div className="loading-skeleton h-3 w-4/5 rounded" style={{ animationDelay: '160ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
