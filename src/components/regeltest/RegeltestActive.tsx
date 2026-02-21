"use client";

import { useEffect } from "react";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { ProgressBar } from "./ProgressBar";
import { Timer } from "./Timer";
import { QuestionCard } from "./QuestionCard";
import { AnswerInput } from "./AnswerInput";
import { QuestionNavigation } from "./QuestionNavigation";

export function RegeltestActive() {
  const questions = useRegeltestStore((s) => s.questions);
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const answers = useRegeltestStore((s) => s.answers);

  const currentQuestion = questions[currentIndex];

  // Prevent accidental tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <ProgressBar
            current={currentIndex}
            total={questions.length}
            answeredCount={answers.size}
          />
        </div>
        <Timer />
      </div>

      <QuestionCard
        situation={currentQuestion.situation}
        questionNumber={currentIndex + 1}
      />

      <AnswerInput />

      <QuestionNavigation />
    </div>
  );
}
