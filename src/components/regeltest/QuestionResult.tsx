"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { RegeltestAnswerResult } from "@/types/regeltest";

interface QuestionResultProps {
  result: RegeltestAnswerResult;
}

const scoreColors = {
  0: "bg-error-light text-error border-error/20",
  1: "bg-warning-light text-warning-text border-warning/20",
  2: "bg-success-light text-success-text border-success/20",
} as const;

const scoreLabels = {
  0: "0 Punkte",
  1: "1 Punkt",
  2: "2 Punkte",
} as const;

export function QuestionResult({ result }: QuestionResultProps) {
  const score = result.score as 0 | 1 | 2;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-accent-text">
            Frage {result.questionIndex + 1}
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-0.5 text-xs font-bold",
              scoreColors[score]
            )}
          >
            {scoreLabels[score]}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">
          {result.situation}
        </p>

        <div className="space-y-2 rounded-[var(--radius-lg)] bg-surface-raised p-3">
          <div>
            <span className="text-xs font-medium text-text-tertiary">
              Deine Antwort:
            </span>
            <p className="text-sm text-text-primary">
              {result.userAnswer || "(keine Antwort)"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-tertiary">
              Musterantwort:
            </span>
            <p className="text-sm text-success-text">{result.correctAnswer}</p>
          </div>
        </div>

        {result.aiFeedback && (
          <div className="rounded-[var(--radius-lg)] border border-feedback-border bg-feedback-bg p-3">
            <span className="text-xs font-medium text-feedback-label">
              Bewertung:
            </span>
            <p className="text-sm text-feedback-text">{result.aiFeedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
