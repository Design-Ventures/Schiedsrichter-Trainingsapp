"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";
import type { RegeltestQuestion } from "@/types/regeltest";

type AnimationPhase = "checkoff" | "waiting" | "ring" | "done";

// ─── Main Component ───

export function EvaluatingView() {
  const phase = useRegeltestStore((s) => s.phase);
  const questions = useRegeltestStore((s) => s.questions);
  const results = useRegeltestStore((s) => s.results);
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

  // Checkoff finished
  const handleCheckoffComplete = useCallback(() => {
    if (isApiDone) {
      setAnimPhase("ring");
    } else {
      setAnimPhase("waiting");
    }
  }, [isApiDone]);

  // Waiting → ring when API finishes
  useEffect(() => {
    if (animPhase === "waiting" && isApiDone) {
      const t = setTimeout(() => setAnimPhase("ring"), 300);
      return () => clearTimeout(t);
    }
  }, [animPhase, isApiDone]);

  // Ring reveal finished → transition to results
  const handleRingComplete = useCallback(() => {
    setAnimPhase("done");
    setTimeout(() => setPhase("results"), 600);
  }, [setPhase]);

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

  const percentage = results
    ? Math.round((results.totalScore / results.maxScore) * 100)
    : 0;
  const passed = percentage >= 80;

  return (
    <div
      className="space-y-6"
      aria-busy={animPhase !== "done"}
      aria-label="Auswertung l\u00e4uft"
    >
      {(animPhase === "checkoff" || animPhase === "waiting") && (
        <QuestionCheckoffList
          questions={questions}
          isWaiting={animPhase === "waiting"}
          onComplete={handleCheckoffComplete}
        />
      )}
      {animPhase === "ring" && results && (
        <ScoreRingReveal
          percentage={percentage}
          passed={passed}
          totalScore={results.totalScore}
          maxScore={results.maxScore}
          onComplete={handleRingComplete}
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

  // Auto-scroll to keep current item visible
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
      const timeout = setTimeout(onComplete, 500);
      return () => clearTimeout(timeout);
    }
  }, [checkedCount, questions.length, onComplete]);

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:p-6">
      <div
        ref={scrollRef}
        className="max-h-[360px] overflow-y-auto scroll-smooth"
        style={{
          maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
      >
        <div className="space-y-0.5">
          {questions.map((q, i) => (
            <CheckoffItem
              key={q.id}
              index={i}
              situation={q.situation}
              isVisible={i < checkedCount}
              isFaded={i < checkedCount - 3}
              isWaiting={
                isWaiting &&
                i === questions.length - 1 &&
                checkedCount === questions.length
              }
            />
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 rounded-full bg-fill-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-200 ease-out"
            style={{
              width: `${(checkedCount / questions.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
          {checkedCount}/{questions.length}
        </span>
      </div>
    </div>
  );
}

// ─── Single Checkoff Item ───

function CheckoffItem({
  index,
  situation,
  isVisible,
  isFaded,
  isWaiting,
}: {
  index: number;
  situation: string;
  isVisible: boolean;
  isFaded: boolean;
  isWaiting: boolean;
}) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 transition-all duration-200",
        isWaiting && "bg-fill-tertiary animate-pulse",
        isFaded && "opacity-40"
      )}
    >
      <span className="text-[13px] sm:text-sm font-medium text-text-tertiary w-7 text-right tabular-nums shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 text-[13px] sm:text-sm text-text-primary truncate">
        {situation}
      </span>
      <div className="w-5 h-5 shrink-0">
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
      </div>
    </div>
  );
}

// ─── Score Ring Reveal ───

function ScoreRingReveal({
  percentage,
  passed,
  totalScore,
  maxScore,
  onComplete,
}: {
  percentage: number;
  passed: boolean;
  totalScore: number;
  maxScore: number;
  onComplete: () => void;
}) {
  const [showNumber, setShowNumber] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const hasCompleted = useRef(false);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (percentage / 100) * circumference;

  const handleRingDone = useCallback(() => {
    setShowNumber(true);
    setTimeout(() => setShowLabel(true), 300);
    setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete();
      }
    }, 900);
  }, [onComplete]);

  // Encouraging label
  const label = passed ? "Bestanden!" : "Weiter trainieren";

  return (
    <motion.div
      className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 sm:p-10 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div
        className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32"
        role="progressbar"
        aria-valuenow={showNumber ? percentage : 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-fill-tertiary)"
            strokeWidth="7"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={passed ? "var(--color-success)" : "var(--color-warm)"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
            onAnimationComplete={handleRingDone}
          />
        </svg>

        {/* Percentage number */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            showNumber
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.5 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <span
            className={cn(
              "text-3xl sm:text-4xl font-bold",
              passed ? "text-success-text" : "text-warm-text"
            )}
            aria-live="polite"
          >
            {percentage}%
          </span>
        </motion.div>
      </div>

      {/* Pass/fail label + score */}
      <motion.div
        className="mt-5"
        initial={{ opacity: 0, y: 10 }}
        animate={showLabel ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <h2
          className={cn(
            "text-xl font-bold",
            passed ? "text-success-text" : "text-warm-text"
          )}
        >
          {label}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {totalScore} von {maxScore} Punkten
        </p>
      </motion.div>
    </motion.div>
  );
}
