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
      <div className="space-y-4">
        {/* Question grid (TEST mode only) */}
        {mode === "TEST" && (
          <div className="flex flex-wrap gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => goToQuestion(i)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[--radius-md] text-xs font-medium transition-colors",
                  i === currentIndex
                    ? "bg-primary text-white"
                    : answers.has(i)
                      ? "bg-primary/15 text-primary-dark"
                      : "bg-gray-100 text-text-tertiary hover:bg-gray-200"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={!canGoBack}
            className={cn(!canGoBack && "invisible")}
          >
            Zurück
          </Button>

          {isLastQuestion ? (
            <Button onClick={() => setShowConfirm(true)}>
              Test abgeben
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
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
