"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { REGELTEST_CONFIG } from "@/types/regeltest";

export function Timer() {
  const mode = useRegeltestStore((s) => s.mode);
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const handleTimeout = useRegeltestStore((s) => s.handleTimeout);

  const timeLimit = mode ? (REGELTEST_CONFIG[mode].timeLimitPerQuestion ?? 0) : 0;
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  // Reset when question changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [currentIndex, timeLimit]);

  // Local countdown — no Zustand store updates per tick
  useEffect(() => {
    if (mode !== "EXAM" || timeLimit === 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timeLimit, handleTimeout, currentIndex]);

  if (mode !== "EXAM") return null;

  const isWarning = timeRemaining <= 5;

  return (
    <div
      aria-live="polite"
      aria-label={`${timeRemaining} Sekunden verbleibend`}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-lg)] px-4 py-2 font-mono text-lg font-bold tabular-nums",
        isWarning
          ? "animate-pulse bg-error-light text-error"
          : "bg-exam-light text-exam"
      )}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      {timeRemaining}s
    </div>
  );
}
