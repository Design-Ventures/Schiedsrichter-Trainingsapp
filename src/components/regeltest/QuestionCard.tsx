"use client";

import { Card, CardContent } from "@/components/ui/card";

interface QuestionCardProps {
  situation: string;
  questionNumber: number;
}

export function QuestionCard({ situation, questionNumber }: QuestionCardProps) {
  return (
    <Card className="border-l-[3px] border-l-accent/30">
      <CardContent>
        <div className="mb-2 text-sm font-medium text-accent-text">
          Situation {questionNumber}
        </div>
        <p className="text-[15px] text-text-primary leading-[1.7] whitespace-pre-line">
          {situation}
        </p>
      </CardContent>
    </Card>
  );
}
