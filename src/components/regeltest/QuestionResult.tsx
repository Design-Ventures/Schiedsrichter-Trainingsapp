"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { RegeltestAnswerResult } from "@/types/regeltest";

interface QuestionResultProps {
  result: RegeltestAnswerResult;
}

const scoreColors = {
  0: "bg-red-100 text-red-700 border-red-200",
  1: "bg-yellow-100 text-yellow-700 border-yellow-200",
  2: "bg-green-100 text-green-700 border-green-200",
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
          <div className="text-sm font-medium text-dfb-green">
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

        <p className="text-sm leading-relaxed text-dfb-dark whitespace-pre-line">
          {result.situation}
        </p>

        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div>
            <span className="text-xs font-medium text-gray-500">
              Deine Antwort:
            </span>
            <p className="text-sm text-dfb-dark">
              {result.userAnswer || "(keine Antwort)"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">
              Musterantwort:
            </span>
            <p className="text-sm text-dfb-green-dark">{result.correctAnswer}</p>
          </div>
        </div>

        {result.aiFeedback && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <span className="text-xs font-medium text-blue-600">
              KI-Bewertung:
            </span>
            <p className="text-sm text-blue-900">{result.aiFeedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
