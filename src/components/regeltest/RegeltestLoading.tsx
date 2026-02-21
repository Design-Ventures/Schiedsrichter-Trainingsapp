"use client";

export function RegeltestLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-dfb-green border-t-transparent" />
      <h2 className="mb-2 text-lg font-semibold text-dfb-dark">
        Regeltest wird geladen...
      </h2>
      <p className="text-sm text-gray-500">Fragen werden zufällig ausgewählt.</p>
    </div>
  );
}
