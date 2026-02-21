"use client";

import { Textarea } from "@/components/ui/textarea";
import { useRegeltestStore } from "@/stores/regeltestStore";

export function AnswerInput() {
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const answers = useRegeltestStore((s) => s.answers);
  const setAnswer = useRegeltestStore((s) => s.setAnswer);

  const currentAnswer = answers.get(currentIndex) || "";

  return (
    <Textarea
      id="answer-input"
      label="Deine Antwort"
      placeholder="Beschreibe die korrekte Entscheidung des Schiedsrichters..."
      value={currentAnswer}
      onChange={(e) => setAnswer(currentIndex, e.target.value)}
      rows={4}
    />
  );
}
