"use client";

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
        <span className="font-medium text-text-primary">
          Frage {current + 1} von {total}
        </span>
        <span className="text-text-tertiary">
          {answeredCount} beantwortet
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-fill-tertiary"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Frage ${current + 1} von ${total}`}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
