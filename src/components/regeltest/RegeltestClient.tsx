"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRegeltestStore } from "@/stores/regeltestStore";
import type { RegeltestMode } from "@/types/regeltest";
import { RegeltestLoading } from "./RegeltestLoading";
import { RegeltestActive } from "./RegeltestActive";
import { ResultScreen } from "./ResultScreen";

// Lazy-load views that aren't needed on initial render
const EvaluationAnimation = dynamic(
  () =>
    import("./EvaluationAnimation").then((m) => ({
      default: m.EvaluationAnimation,
    })),
  { ssr: false }
);
const RegeltestError = dynamic(
  () => import("./RegeltestError").then((m) => ({ default: m.RegeltestError }))
);

interface RegeltestClientProps {
  initialMode: RegeltestMode;
  initialTags?: string[];
}

export function RegeltestClient({
  initialMode,
  initialTags,
}: RegeltestClientProps) {
  const phase = useRegeltestStore((s) => s.phase);
  const results = useRegeltestStore((s) => s.results);
  const startSession = useRegeltestStore((s) => s.startSession);
  const setPhase = useRegeltestStore((s) => s.setPhase);
  const reset = useRegeltestStore((s) => s.reset);
  const tagsKey = initialTags?.join(",") ?? "";

  // Track crossfade transition state
  const [evalVisible, setEvalVisible] = useState(false);
  const [evalFadingOut, setEvalFadingOut] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    reset();
    startSession(initialMode, initialTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, tagsKey]);

  // Show EvaluationAnimation when entering eval phases
  useEffect(() => {
    if (
      phase === "submitting" ||
      phase === "evaluating" ||
      phase === "evaluating_done"
    ) {
      setEvalVisible(true);
      setEvalFadingOut(false);
      setShowResults(false);
    } else if (
      phase === "idle" ||
      phase === "loading" ||
      phase === "active"
    ) {
      setEvalVisible(false);
      setEvalFadingOut(false);
      setShowResults(false);
    }
  }, [phase]);

  // Crossfade: EvaluationAnimation fades out, ResultScreen appears underneath
  const handleEvalComplete = useCallback(() => {
    // 1. Show ResultScreen immediately (it's behind the overlay at z-40)
    setShowResults(true);

    // 2. Start fading out the EvaluationAnimation overlay (z-50)
    setEvalFadingOut(true);

    // 3. After crossfade, clean up overlay and sync store phase
    setTimeout(() => {
      setEvalVisible(false);
      setEvalFadingOut(false);
      setPhase("results");
    }, 400);
  }, [setPhase]);

  // Standard flow content (non-overlay phases)
  const content = (() => {
    switch (phase) {
      case "idle":
      case "loading":
        return <RegeltestLoading />;
      case "active":
        return <RegeltestActive />;
      case "submitting":
      case "evaluating":
      case "evaluating_done":
        return null;
      case "results":
        return null; // ResultScreen is rendered separately as a fixed overlay
      case "error":
        return <RegeltestError />;
      default:
        return <RegeltestLoading />;
    }
  })();

  return (
    <>
      {initialTags && initialTags.length > 0 && phase === "active" && (
        <div className="mb-4 text-center">
          <span className="text-[13px] text-text-tertiary">
            {initialTags.join(", ")}
          </span>
        </div>
      )}
      {content}
      {(showResults || phase === "results") && results && <ResultScreen />}
      {evalVisible && (
        <EvaluationAnimation
          onComplete={handleEvalComplete}
          fadingOut={evalFadingOut}
        />
      )}
    </>
  );
}
