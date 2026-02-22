"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { REGELTEST_CONFIG } from "@/types/regeltest";
import { QuestionResult } from "./QuestionResult";

export function ResultsView() {
  const results = useRegeltestStore((s) => s.results);
  const reset = useRegeltestStore((s) => s.reset);
  const router = useRouter();

  if (!results) return null;

  const weakTags = Array.from(
    new Set(
      results.answers
        .filter((a) => a.score === 0)
        .flatMap((a) => a.tags)
    )
  );

  const config = REGELTEST_CONFIG[results.mode];
  const passScore = Math.ceil(results.maxScore * (config.passPercentage / 100));
  const passed = results.totalScore >= passScore;

  const completedDate = new Date(results.completedAt).toLocaleDateString(
    "de-DE",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      {/* Neutral header */}
      <p className="text-center text-sm text-text-secondary">
        {results.totalQuestions} Situationen abgeschlossen &middot;{" "}
        {completedDate}
      </p>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {([2, 1, 0] as const).map((score) => {
          const count = results.answers.filter(
            (a) => a.score === score
          ).length;
          const labels = { 2: "2 Punkte", 1: "1 Punkt", 0: "0 Punkte" };
          const colors = {
            2: "text-success-text bg-success-light",
            1: "text-warning-text bg-warning-light",
            0: "text-error bg-error-light",
          };
          return (
            <div
              key={score}
              className={cn(
                "rounded-[var(--radius-lg)] p-3 text-center",
                colors[score]
              )}
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

      {/* Pass/fail context */}
      <div
        className={cn(
          "rounded-[var(--radius-lg)] p-4 text-sm",
          passed
            ? "bg-success-light text-success-text"
            : "bg-error-light text-error"
        )}
      >
        <p>
          Zum Bestehen benötigst du {passScore} Punkte — du hattest{" "}
          {results.totalScore}.{" "}
          <span className="font-semibold">
            {passed ? "Bestanden." : "Nicht bestanden."}
          </span>
        </p>
      </div>

      {/* Weak categories CTA */}
      {weakTags.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-4 sm:p-5">
          <h4 className="text-[15px] font-semibold text-text-primary">
            {weakTags.length === 1
              ? `Jetzt ${weakTags[0]} gezielt üben`
              : "Schwache Kategorien trainieren"}
          </h4>
          <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed">
            {weakTags.length === 1
              ? `Du hattest Schwierigkeiten bei "${weakTags[0]}". Starte einen gezielten Übungstest.`
              : `Du hattest Schwierigkeiten in ${weakTags.length} Kategorien. Trainiere gezielt deine Schwächen.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {weakTags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
            {weakTags.length > 5 && (
              <span className="inline-block rounded-full bg-fill-tertiary px-2.5 py-0.5 text-[11px] text-text-tertiary">
                +{weakTags.length - 5}
              </span>
            )}
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              const tagsParam = weakTags.join(",");
              router.push(`/regeltest?mode=TEST&tags=${encodeURIComponent(tagsParam)}`);
            }}
          >
            {weakTags.length === 1
              ? `${weakTags[0]} üben`
              : "Schwache Kategorien üben"}
          </Button>
        </div>
      )}

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
