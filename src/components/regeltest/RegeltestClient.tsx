"use client";

import { useEffect } from "react";
import { useRegeltestStore } from "@/stores/regeltestStore";
import type { RegeltestMode } from "@/types/regeltest";
import { RegeltestLoading } from "./RegeltestLoading";
import { RegeltestActive } from "./RegeltestActive";
import { EvaluatingView } from "./EvaluatingView";
import { ResultsView } from "./ResultsView";
import { RegeltestError } from "./RegeltestError";

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
      return <EvaluatingView />;
    case "results":
      return <ResultsView />;
    case "error":
      return <RegeltestError />;
    default:
      return <RegeltestLoading />;
  }
}
