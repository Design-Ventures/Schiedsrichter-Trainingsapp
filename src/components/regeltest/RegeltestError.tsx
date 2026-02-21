"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRegeltestStore } from "@/stores/regeltestStore";

export function RegeltestError() {
  const errorMessage = useRegeltestStore((s) => s.errorMessage);
  const mode = useRegeltestStore((s) => s.mode);
  const startSession = useRegeltestStore((s) => s.startSession);
  const reset = useRegeltestStore((s) => s.reset);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardContent>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
            <svg
              className="h-6 w-6 text-error"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-text-primary">
            Ein Fehler ist aufgetreten
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            {errorMessage || "Unbekannter Fehler"}
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full" onClick={reset}>
                Zum Dashboard
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
        </CardContent>
      </Card>
    </div>
  );
}
