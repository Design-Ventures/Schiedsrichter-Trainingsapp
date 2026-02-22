"use client";

export function EvaluatingView() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Antworten werden bewertet">
      {/* Score circle skeleton */}
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 text-center">
        <div className="mx-auto mb-3 skeleton h-24 w-24 rounded-full" />
        <div className="mx-auto skeleton mb-2 h-6 w-32" />
        <div className="mx-auto skeleton h-4 w-44" />
      </div>

      {/* Score breakdown skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-lg)] bg-fill-tertiary p-3 text-center">
            <div className="mx-auto skeleton mb-1 h-8 w-8" />
            <div className="mx-auto skeleton h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Question result skeletons */}
      <div className="space-y-4">
        <div className="skeleton h-5 w-36" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          Deine Antworten werden bewertet...
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Das kann einen Moment dauern.
        </p>
      </div>
    </div>
  );
}
