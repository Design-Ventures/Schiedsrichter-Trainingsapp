"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
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
  // Use results availability instead of store phase — more robust
  const isApiDone = results !== null;
  const finalScore = results
    ? Math.round((results.totalScore / results.maxScore) * 100)
    : 0;

  const [animPhase, setAnimPhase] = useState<AnimPhase>("processing");
  const [condensingDone, setCondensingDone] = useState(false);

  // Stable ref for onComplete to prevent effect re-runs
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

  // Phase 3 → onComplete after 0.8s (use ref to avoid timeout resets)
  useEffect(() => {
    if (animPhase !== "reveal" || prefersReducedMotion) return;
    const t = setTimeout(() => onCompleteRef.current(), 800);
    return () => clearTimeout(t);
  }, [animPhase, prefersReducedMotion]);

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "#0A0A14" }}
        aria-busy="true"
        aria-label="Auswertung wird erstellt"
      >
        <p style={{ color: "#6B7280", fontSize: 14 }}>
          Auswertung wird erstellt...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#0A0A14" }}
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-busy={animPhase !== "reveal"}
      aria-label="Auswertung läuft"
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

  // Build visible window of ~4 items
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: 280,
        overflow: "hidden",
        height: 160,
      }}
    >
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
  const stateColors = {
    active: "#FFFFFF",
    checked: "#6B7280",
    fading: "#374151",
  };

  const stateOpacity = {
    active: 1,
    checked: 0.7,
    fading: 0.3,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: stateOpacity[state], y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.1, ease: "easeIn" } }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #1F1F3A",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: stateColors[state],
          flexShrink: 0,
        }}
      >
        Situation {questionNumber}
      </span>

      {/* Dotted line — terminal style */}
      <span
        style={{
          flex: 1,
          borderBottom: "1px dotted #1F1F3A",
          margin: "0 8px",
          alignSelf: "center",
          minWidth: 16,
        }}
      />

      {/* Checkmark */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: state !== "active" ? 1 : 0 }}
        transition={{ duration: 0.08 }}
        style={{
          color: "#8B5CF6",
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
          width: 14,
          textAlign: "right",
        }}
      >
        {state !== "active" ? "✓" : ""}
      </motion.span>
    </motion.div>
  );
}

// ─── EvalCondensing (Phase 2) ───

function EvalCondensing() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Central dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#8B5CF6",
        }}
      />

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          fontSize: 12,
          color: "#6B7280",
          textAlign: "center",
          marginTop: 16,
        }}
      >
        Auswertung wird abgeschlossen
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

  // Animate counter 0 → finalScore with easeOut over 800ms
  useEffect(() => {
    const duration = 800;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // cubic easeOut
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
      className="flex flex-col items-center justify-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* SVG Score Ring */}
      <div
        className="relative"
        style={{ width: 168, height: 168 }}
        role="progressbar"
        aria-valuenow={displayNum}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg
          width={168}
          height={168}
          viewBox="0 0 168 168"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background ring */}
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="#1F1F3A"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <motion.circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>

        {/* Percentage number */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          {displayNum}%
        </div>
      </div>
    </motion.div>
  );
}
