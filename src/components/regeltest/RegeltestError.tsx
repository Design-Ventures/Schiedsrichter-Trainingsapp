"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRegeltestStore } from "@/stores/regeltestStore";

export function RegeltestError() {
  const errorMessage = useRegeltestStore((s) => s.errorMessage);
  const mode = useRegeltestStore((s) => s.mode);
  const startSession = useRegeltestStore((s) => s.startSession);
  const reset = useRegeltestStore((s) => s.reset);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <svg
          className="mx-auto h-8 w-8 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          Ein Fehler ist aufgetreten
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          {errorMessage || "Unbekannter Fehler"}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full" onClick={reset}>
              Dashboard
            </Button>
          </Link>
          {mode && (
            <Button
              onClick={() => startSession(mode)}
              className="flex-1"
            >
              Erneut versuchen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
