"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";

export function Timer() {
  const timeRemaining = useRegeltestStore((s) => s.timeRemaining);
  const tickTimer = useRegeltestStore((s) => s.tickTimer);
  const mode = useRegeltestStore((s) => s.mode);

  useEffect(() => {
    if (mode !== "EXAM") return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, tickTimer]);

  if (mode !== "EXAM") return null;

  const isWarning = timeRemaining <= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold tabular-nums",
        isWarning
          ? "animate-pulse bg-red-100 text-red-600"
          : "bg-dfb-green/10 text-dfb-green"
      )}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
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
