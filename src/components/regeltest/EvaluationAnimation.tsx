"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";

// ─── Types ───

interface EvaluationAnimationProps {
  onComplete: () => void;
  fadingOut?: boolean;
}

type AnimPhase = "processing" | "condensing" | "reveal";

// ─── Main Component ───

export function EvaluationAnimation({
  onComplete,
  fadingOut = false,
}: EvaluationAnimationProps) {
  const questions = useRegeltestStore((s) => s.questions);
  const results = useRegeltestStore((s) => s.results);
  const prefersReducedMotion = useReducedMotion();

  const totalQuestions = questions.length;
  const isApiDone = results !== null;
  const finalScore = results
    ? Math.round((results.totalScore / results.maxScore) * 100)
    : 0;

  const [animPhase, setAnimPhase] = useState<AnimPhase>("processing");
  const [condensingDone, setCondensingDone] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reduced motion: skip animation, wait for API only
  useEffect(() => {
    if (prefersReducedMotion && isApiDone) {
      onCompleteRef.current();
    }
  }, [prefersReducedMotion, isApiDone]);

  // Phase 1 → Phase 2 after ~4s
  useEffect(() => {
    if (prefersReducedMotion) return;
    const t = setTimeout(() => setAnimPhase("condensing"), 4000);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);

  // Condensing animation takes 1s
  useEffect(() => {
    if (animPhase !== "condensing" || prefersReducedMotion) return;
    const t = setTimeout(() => setCondensingDone(true), 1000);
    return () => clearTimeout(t);
  }, [animPhase, prefersReducedMotion]);

  // Move to reveal when BOTH condensing is done AND API is done
  useEffect(() => {
    if (condensingDone && isApiDone) {
      setAnimPhase("reveal");
    }
  }, [condensingDone, isApiDone]);

  // Phase 3 → onComplete after 0.8s
  useEffect(() => {
    if (animPhase !== "reveal" || prefersReducedMotion) return;
    const t = setTimeout(() => onCompleteRef.current(), 800);
    return () => clearTimeout(t);
  }, [animPhase, prefersReducedMotion]);

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900"
        aria-busy="true"
        aria-label="Auswertung wird erstellt"
      >
        <p className="text-sm text-gray-400">
          Auswertung wird erstellt...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900"
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-busy={animPhase !== "reveal"}
      aria-label="Dein Ergebnis wird berechnet"
    >
      <AnimatePresence mode="wait">
        {animPhase === "processing" && (
          <motion.div
            key="processing"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EvalQuestionFeed totalQuestions={totalQuestions} />
          </motion.div>
        )}
        {animPhase === "condensing" && (
          <motion.div
            key="condensing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EvalCondensing />
          </motion.div>
        )}
        {animPhase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <EvalReveal finalScore={finalScore} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── EvalQuestionFeed (Phase 1) ───

function EvalQuestionFeed({ totalQuestions }: { totalQuestions: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalMs = Math.floor(4000 / totalQuestions);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => {
        if (i >= totalQuestions - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [totalQuestions, intervalMs]);

  const windowSize = 4;
  const startIndex = Math.max(0, activeIndex - windowSize + 1);
  const items: { index: number; state: "active" | "checked" | "fading" }[] = [];
  for (
    let i = startIndex;
    i <= Math.min(activeIndex, totalQuestions - 1);
    i++
  ) {
    const dist = activeIndex - i;
    let state: "active" | "checked" | "fading";
    if (dist === 0) state = "active";
    else if (dist <= 2) state = "checked";
    else state = "fading";
    items.push({ index: i, state });
  }

  return (
    <div className="flex flex-col gap-2 w-[280px] overflow-hidden h-[160px]">
      <AnimatePresence mode="popLayout">
        {items.map(({ index, state }) => (
          <EvalQuestionItem
            key={index}
            questionNumber={index + 1}
            state={state}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── EvalQuestionItem ───

function EvalQuestionItem({
  questionNumber,
  state,
}: {
  questionNumber: number;
  state: "active" | "checked" | "fading";
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: state === "fading" ? 0.3 : state === "checked" ? 0.7 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.1, ease: "easeIn" } }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="flex items-center py-2.5 border-b border-gray-700/40"
    >
      <span
        className={cn(
          "text-xs font-medium shrink-0",
          state === "active"
            ? "text-white"
            : "text-gray-400"
        )}
      >
        Situation {questionNumber}
      </span>

      {/* Dotted line */}
      <span className="flex-1 border-b border-dotted border-gray-700/40 mx-2 self-center min-w-4" />

      {/* Checkmark */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: state !== "active" ? 1 : 0 }}
        transition={{ duration: 0.08 }}
        className="text-accent text-xs font-semibold shrink-0 w-3.5 text-right"
      >
        {state !== "active" ? "\u2713" : ""}
      </motion.span>
    </motion.div>
  );
}

// ─── EvalCondensing (Phase 2) ───

function EvalCondensing() {
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-2 h-2 rounded-full bg-accent"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-xs text-gray-400 text-center mt-4"
      >
        Dein Ergebnis wird berechnet
      </motion.div>
    </div>
  );
}

// ─── EvalReveal + EvalScoreRing (Phase 3) ───

function EvalReveal({ finalScore }: { finalScore: number }) {
  const [displayNum, setDisplayNum] = useState(0);
  const rafRef = useRef<number>(0);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - finalScore / 100);

  useEffect(() => {
    const duration = 800;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(Math.round(eased * finalScore));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [finalScore]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center animate-score-glow rounded-full"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className="relative w-[168px] h-[168px]"
        role="progressbar"
        aria-valuenow={displayNum}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg
          width={168}
          height={168}
          viewBox="0 0 168 168"
          className="-rotate-90"
        >
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            className="stroke-gray-700/40"
            strokeWidth="4"
          />
          <motion.circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            className="stroke-accent"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white">
          {displayNum}%
        </div>
      </div>
    </motion.div>
  );
}
