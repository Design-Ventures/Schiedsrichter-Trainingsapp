"use client";

export function EvaluatingView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <h2 className="mb-2 text-xl font-bold text-text-primary">
        Deine Antworten werden bewertet...
      </h2>
      <p className="text-sm text-text-secondary">
        Die KI analysiert deine Antworten. Das kann einen Moment dauern.
      </p>
    </div>
  );
}
