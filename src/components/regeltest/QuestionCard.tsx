"use client";

import { Card, CardContent } from "@/components/ui/card";

interface QuestionCardProps {
  situation: string;
  questionNumber: number;
}

export function QuestionCard({ situation, questionNumber }: QuestionCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="mb-2 text-sm font-medium text-accent">
          Situation {questionNumber}
        </div>
        <p className="text-text-primary leading-relaxed whitespace-pre-line">
          {situation}
        </p>
      </CardContent>
    </Card>
  );
}
