"use client";

export function RegeltestLoading() {
  return (
    <div className="space-y-4 pb-24" aria-busy="true" aria-label="Regeltest wird geladen">
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="skeleton h-[3px] w-full rounded-full" />
      </div>

      {/* Question card skeleton */}
      <div className="rounded-[var(--radius-xl)] bg-surface p-6">
        <div className="skeleton mb-3 h-4 w-24" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>

      {/* Answer textarea skeleton */}
      <div>
        <div className="skeleton mb-1.5 h-4 w-24" />
        <div className="skeleton h-[120px] w-full rounded-[var(--radius-lg)]" />
      </div>

      {/* Status text */}
      <p className="text-center text-sm text-text-secondary">
        Fragen werden zufällig ausgewählt...
      </p>
    </div>
  );
}
