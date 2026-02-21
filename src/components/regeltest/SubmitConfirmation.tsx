"use client";

import { Button } from "@/components/ui/button";

interface SubmitConfirmationProps {
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmation({
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  const unanswered = totalCount - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-dfb-dark">
          Test abgeben?
        </h3>
        <p className="mb-1 text-sm text-gray-600">
          Du hast {answeredCount} von {totalCount} Fragen beantwortet.
        </p>
        {unanswered > 0 && (
          <p className="mb-4 text-sm font-medium text-red-600">
            {unanswered} Frage{unanswered > 1 ? "n" : ""} ohne Antwort (0 Punkte).
          </p>
        )}
        {unanswered === 0 && <div className="mb-4" />}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Abbrechen
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Abgeben
          </Button>
        </div>
      </div>
    </div>
  );
}
