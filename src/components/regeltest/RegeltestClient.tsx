"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRegeltestStore } from "@/stores/regeltestStore";
import type { RegeltestMode } from "@/types/regeltest";
import { RegeltestLoading } from "./RegeltestLoading";
import { RegeltestActive } from "./RegeltestActive";

// Lazy-load views that aren't needed on initial render
const EvaluatingView = dynamic(
  () => import("./EvaluatingView").then((m) => ({ default: m.EvaluatingView })),
  { loading: () => <RegeltestLoading /> }
);
const ResultsView = dynamic(
  () => import("./ResultsView").then((m) => ({ default: m.ResultsView })),
  { loading: () => <RegeltestLoading /> }
);
const RegeltestError = dynamic(
  () => import("./RegeltestError").then((m) => ({ default: m.RegeltestError }))
);

interface RegeltestClientProps {
  initialMode: RegeltestMode;
}

export function RegeltestClient({ initialMode }: RegeltestClientProps) {
  const phase = useRegeltestStore((s) => s.phase);
  const startSession = useRegeltestStore((s) => s.startSession);
  const reset = useRegeltestStore((s) => s.reset);

  useEffect(() => {
    reset();
    startSession(initialMode);
  }, [initialMode, reset, startSession]);

  switch (phase) {
    case "idle":
    case "loading":
      return <RegeltestLoading />;
    case "active":
      return <RegeltestActive />;
    case "submitting":
    case "evaluating":
    case "evaluating_done":
      return <EvaluatingView />;
    case "results":
      return <ResultsView />;
    case "error":
      return <RegeltestError />;
    default:
      return <RegeltestLoading />;
  }
}
