"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";
import type { RegeltestQuestion } from "@/types/regeltest";

type AnimationPhase = "checkoff" | "waiting" | "done";

// ─── Main Component ───

export function EvaluatingView() {
  const phase = useRegeltestStore((s) => s.phase);
  const questions = useRegeltestStore((s) => s.questions);
  const setPhase = useRegeltestStore((s) => s.setPhase);
  const prefersReducedMotion = useReducedMotion();

  const [animPhase, setAnimPhase] = useState<AnimationPhase>("checkoff");
  const isApiDone = phase === "evaluating_done";

  // Reduced motion: skip animation, wait for API only
  useEffect(() => {
    if (prefersReducedMotion && isApiDone) {
      setPhase("results");
    }
  }, [prefersReducedMotion, isApiDone, setPhase]);

  const handleCheckoffComplete = useCallback(() => {
    if (isApiDone) {
      setAnimPhase("done");
      setTimeout(() => setPhase("results"), 400);
    } else {
      setAnimPhase("waiting");
    }
  }, [isApiDone, setPhase]);

  // Waiting → done when API finishes
  useEffect(() => {
    if (animPhase === "waiting" && isApiDone) {
      const t = setTimeout(() => {
        setAnimPhase("done");
        setTimeout(() => setPhase("results"), 400);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [animPhase, isApiDone, setPhase]);

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Auswertung wird erstellt"
      >
        <div className="flex justify-center">
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] bg-fill-tertiary p-3 text-center"
            >
              <div className="mx-auto skeleton mb-1 h-8 w-8" />
              <div className="mx-auto skeleton h-3 w-14" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="skeleton h-5 w-36" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 space-y-3"
            >
              <div className="flex justify-between">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
              <div className="rounded-[var(--radius-lg)] bg-surface-raised p-3 space-y-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[var(--radius-lg)] bg-fill-tertiary p-4">
          <div className="skeleton h-4 w-64 mx-auto" />
        </div>
        <p className="text-center text-sm font-medium text-text-primary animate-pulse">
          Auswertung wird erstellt...
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      aria-busy={animPhase !== "done"}
      aria-label="Auswertung läuft"
    >
      {(animPhase === "checkoff" || animPhase === "waiting") && (
        <QuestionCheckoffList
          questions={questions}
          isWaiting={animPhase === "waiting"}
          onComplete={handleCheckoffComplete}
        />
      )}
    </div>
  );
}

// ─── Question Checkoff List ───

function QuestionCheckoffList({
  questions,
  isWaiting,
  onComplete,
}: {
  questions: RegeltestQuestion[];
  isWaiting: boolean;
  onComplete: () => void;
}) {
  const [checkedCount, setCheckedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCompleted = useRef(false);
  const intervalMs = questions.length > 20 ? 200 : 300;

  useEffect(() => {
    const timer = setInterval(() => {
      setCheckedCount((prev) => {
        if (prev >= questions.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [questions.length, intervalMs]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [checkedCount]);

  // Fire onComplete once when all questions are checked
  useEffect(() => {
    if (checkedCount === questions.length && !hasCompleted.current) {
      hasCompleted.current = true;
      const timeout = setTimeout(onComplete, 400);
      return () => clearTimeout(timeout);
    }
  }, [checkedCount, questions.length, onComplete]);

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:p-6">
      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto scroll-smooth"
        style={{
          maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 85%, transparent 100%)",
        }}
      >
        <div className="space-y-0.5">
          {questions.map((q, i) => (
            <CheckoffItem
              key={q.id}
              index={i}
              situation={q.situation}
              isVisible={i < checkedCount}
              isChecked={i < checkedCount}
              isWaiting={isWaiting && i === questions.length - 1 && checkedCount === questions.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Single Checkoff Item ───

function CheckoffItem({
  index,
  situation,
  isVisible,
  isChecked,
  isWaiting,
}: {
  index: number;
  situation: string;
  isVisible: boolean;
  isChecked: boolean;
  isWaiting: boolean;
}) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 transition-colors duration-150",
        isWaiting && "bg-fill-tertiary animate-pulse"
      )}
    >
      <span className="text-[13px] sm:text-sm font-medium text-text-tertiary w-7 text-right tabular-nums shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 text-[13px] sm:text-sm text-text-primary truncate">
        {situation}
      </span>
      <div className="w-5 h-5 shrink-0">
        {isChecked && (
          <motion.svg
            viewBox="0 0 20 20"
            className="w-5 h-5"
            style={{ color: "var(--color-success)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <motion.path
              d="M6 10l3 3 5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            />
          </motion.svg>
        )}
      </div>
    </div>
  );
}
