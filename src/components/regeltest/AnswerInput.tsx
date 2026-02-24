"use client";

import { Textarea } from "@/components/ui/textarea";
import { useRegeltestStore } from "@/stores/regeltestStore";

export function AnswerInput() {
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const answers = useRegeltestStore((s) => s.answers);
  const setAnswer = useRegeltestStore((s) => s.setAnswer);
  const setPendingAnswer = useRegeltestStore((s) => s.setPendingAnswer);

  const currentAnswer = answers.get(currentIndex) || "";

  return (
    <Textarea
      id="answer-input"
      label="Deine Entscheidung"
      placeholder="Was ist die korrekte Entscheidung des Schiedsrichters? Beschreibe Spielfortsetzung und pers&ouml;nliche Strafe..."
      value={currentAnswer}
      onChange={(e) => {
        setAnswer(currentIndex, e.target.value);
        setPendingAnswer(currentIndex, e.target.value);
      }}
      rows={5}
    />
  );
}
