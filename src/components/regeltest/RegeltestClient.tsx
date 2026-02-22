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
  initialTags?: string[];
}

export function RegeltestClient({ initialMode, initialTags }: RegeltestClientProps) {
  const phase = useRegeltestStore((s) => s.phase);
  const startSession = useRegeltestStore((s) => s.startSession);
  const reset = useRegeltestStore((s) => s.reset);
  const tagsKey = initialTags?.join(",") ?? "";

  useEffect(() => {
    reset();
    startSession(initialMode, initialTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, tagsKey]);

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
        return <EvaluatingView />;
      case "results":
        return <ResultsView />;
      case "error":
        return <RegeltestError />;
      default:
        return <RegeltestLoading />;
    }
  })();

  return (
    <>
      {initialTags && initialTags.length > 0 && (
        <div className="mb-4 rounded-[var(--radius-lg)] bg-accent/5 border border-accent/15 px-4 py-2.5 text-center">
          <span className="text-[13px] font-medium text-accent">
            Gezieltes Training: {initialTags.join(", ")}
          </span>
        </div>
      )}
      {content}
    </>
  );
}
