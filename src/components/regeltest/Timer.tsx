"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { REGELTEST_CONFIG } from "@/types/regeltest";

export function Timer() {
  const mode = useRegeltestStore((s) => s.mode);
  const currentIndex = useRegeltestStore((s) => s.currentIndex);
  const handleTimeout = useRegeltestStore((s) => s.handleTimeout);

  const timeLimit = mode ? (REGELTEST_CONFIG[mode].timeLimitPerQuestion ?? 0) : 0;
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showFlash, setShowFlash] = useState(false);

  // Ref for handleTimeout to avoid stale closures without adding to deps
  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  // Prevent double-firing timeout on the same question
  const timeoutFiredRef = useRef(false);

  // Reset timer when question changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
    setShowFlash(false);
    timeoutFiredRef.current = false;
  }, [currentIndex, timeLimit]);

  // Countdown interval — only depends on mode and timeLimit
  useEffect(() => {
    if (mode !== "EXAM" || timeLimit === 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timeLimit]);

  // Handle timeout when time reaches 0
  useEffect(() => {
    if (timeRemaining !== 0) return;
    if (mode !== "EXAM" || timeLimit === 0) return;
    if (timeoutFiredRef.current) return;

    timeoutFiredRef.current = true;
    setShowFlash(true);

    const timer = setTimeout(() => {
      handleTimeoutRef.current();
    }, 300);

    return () => clearTimeout(timer);
  }, [timeRemaining, mode, timeLimit]);

  if (mode !== "EXAM") return null;

  const isUrgent = timeRemaining <= 5;
  const isWarning = timeRemaining <= 10 && !isUrgent;

  return (
    <>
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

      {showFlash && (
        <div
          role="alert"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-warm/10 animate-[fadeOut_300ms_ease-out_forwards]",
            "motion-reduce:animate-none motion-reduce:opacity-0"
          )}
        >
          <span className="rounded-lg bg-warm-light px-6 py-3 text-lg font-bold text-warm-text shadow-lg">
            Zeit abgelaufen!
          </span>
        </div>
      )}
    </>
  );
}
