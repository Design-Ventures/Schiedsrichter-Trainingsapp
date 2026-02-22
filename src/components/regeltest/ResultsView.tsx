"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { QuestionResult } from "./QuestionResult";

export function ResultsView() {
  const results = useRegeltestStore((s) => s.results);
  const reset = useRegeltestStore((s) => s.reset);

  if (!results) return null;

  const percentage = Math.round((results.totalScore / results.maxScore) * 100);
  const passed = percentage >= 80;

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <Card>
        <CardContent className="text-center">
          <div
            className={cn(
              "mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold",
              passed
                ? "bg-success-light text-success-text"
                : "bg-error-light text-error"
            )}
          >
            {percentage}%
          </div>
          <h2 className="mb-1 text-xl font-bold text-text-primary">
            {passed ? "Bestanden!" : "Nicht bestanden"}
          </h2>
          <p className="text-sm text-text-secondary">
            {results.totalScore} von {results.maxScore} Punkten
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {results.totalQuestions} Fragen &middot;{" "}
            {results.mode === "EXAM" ? "Prüfungsmodus" : "Testmodus"}
          </p>
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {([2, 1, 0] as const).map((score) => {
          const count = results.answers.filter((a) => a.score === score).length;
          const labels = { 2: "2 Punkte", 1: "1 Punkt", 0: "0 Punkte" };
          const colors = {
            2: "text-success-text bg-success-light",
            1: "text-warning-text bg-warning-light",
            0: "text-error bg-error-light",
          };
          return (
            <div
              key={score}
              className={cn("rounded-[var(--radius-lg)] p-3 text-center", colors[score])}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs">{labels[score]}</div>
            </div>
          );
        })}
      </div>

      {/* Per-question results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Einzelergebnisse
        </h3>
        {results.answers.map((answer) => (
          <QuestionResult key={answer.questionIndex} result={answer} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">
            Zum Dashboard
          </Button>
        </Link>
        <Button onClick={reset} className="flex-1">
          Neuer Test
        </Button>
      </div>
    </div>
  );
}
