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

  const isUrgent = timeRemaining <= 5;
  const isWarning = timeRemaining <= 10 && !isUrgent;

  return (
    <div
      aria-live="polite"
      aria-label={`${timeRemaining} Sekunden verbleibend`}
      className={cn(
        "font-mono text-lg font-bold tabular-nums transition-all duration-150",
        isUrgent
          ? "text-warm scale-110"
          : isWarning
            ? "text-warning-text"
            : "text-text-tertiary"
      )}
    >
      {timeRemaining}s
    </div>
  );
}
