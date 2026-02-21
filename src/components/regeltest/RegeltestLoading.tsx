"use client";

export function RegeltestLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <h2 className="mb-2 text-lg font-semibold text-text-primary">
        Regeltest wird geladen...
      </h2>
      <p className="text-sm text-text-secondary">Fragen werden zufällig ausgewählt.</p>
    </div>
  );
}
