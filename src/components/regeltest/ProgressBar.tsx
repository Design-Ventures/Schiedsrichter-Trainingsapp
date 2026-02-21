"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  answeredCount: number;
}

export function ProgressBar({ current, total, answeredCount }: ProgressBarProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-dfb-dark">
          Frage {current + 1} von {total}
        </span>
        <span className="text-gray-500">
          {answeredCount} beantwortet
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full bg-dfb-green transition-all duration-300"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
