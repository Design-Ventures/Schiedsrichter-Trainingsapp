"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { SubmitConfirmation } from "./SubmitConfirmation";

export function QuestionNavigation() {
  const [showConfirm, setShowConfirm] = useState(false);
  const mode = useRegeltestStore((s) => s.mode);
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const questions = useRegeltestStore((s) => s.questions);
  const answers = useRegeltestStore((s) => s.answers);
  const nextQuestion = useRegeltestStore((s) => s.nextQuestion);
  const previousQuestion = useRegeltestStore((s) => s.previousQuestion);
  const goToQuestion = useRegeltestStore((s) => s.goToQuestion);
  const submitAllAnswers = useRegeltestStore((s) => s.submitAllAnswers);

  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const canGoBack = mode === "TEST" && !isFirstQuestion;

  return (
    <>
      {/* Question grid (TEST mode only) — stays in scrollable content */}
      {mode === "TEST" && (
        <nav aria-label="Fragen&uuml;bersicht" className="flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goToQuestion(i)}
              aria-label={`Frage ${i + 1}${answers.has(i) ? ", beantwortet" : ""}`}
              aria-current={i === currentIndex ? "step" : undefined}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] text-sm font-medium transition-all",
                i === currentIndex
                  ? "bg-primary text-text-on-primary"
                  : answers.has(i)
                    ? "bg-accent-light text-accent-text"
                    : "bg-fill-tertiary text-text-tertiary hover:bg-fill-active hover:scale-105"
              )}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}

      {/* Fixed bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-surface/80 backdrop-blur-sm shadow-[0_-1px_3px_rgba(28,25,23,0.04)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 pt-3.5 pb-safe sm:px-6">
          {canGoBack ? (
            <Button
              variant="outline"
              size="lg"
              onClick={previousQuestion}
              className="flex-1"
            >
              Zur&uuml;ck
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {isLastQuestion ? (
            <Button
              size="lg"
              onClick={() => setShowConfirm(true)}
              className="flex-1"
            >
              Test abgeben
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={nextQuestion}
              className="flex-1"
            >
              Weiter
            </Button>
          )}
        </div>
      </div>

      {showConfirm && (
        <SubmitConfirmation
          answeredCount={answers.size}
          totalCount={questions.length}
          onConfirm={() => {
            setShowConfirm(false);
            submitAllAnswers();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
