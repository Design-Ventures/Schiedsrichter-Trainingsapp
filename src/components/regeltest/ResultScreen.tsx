"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRegeltestStore } from "@/stores/regeltestStore";
import { REGELTEST_CONFIG } from "@/types/regeltest";
import type { RegeltestAnswerResult } from "@/types/regeltest";

// ─── Types ───

type Mode = "pruefung" | "uebung";

// ─── ResultScreen ───

export function ResultScreen() {
  const results = useRegeltestStore((s) => s.results);

  if (!results) return null;

  const mode: Mode = results.mode === "EXAM" ? "pruefung" : "uebung";
  const percentage = Math.round((results.totalScore / results.maxScore) * 100);
  const config = REGELTEST_CONFIG[results.mode];
  const passScore = Math.ceil(results.maxScore * (config.passPercentage / 100));
  const passed = results.totalScore >= passScore;

  const fullPoints = results.answers.filter((a) => a.score === 2).length;
  const partialPoints = results.answers.filter((a) => a.score === 1).length;
  const noPoints = results.answers.filter((a) => a.score === 0).length;

  const weakTags = Array.from(
    new Set(
      results.answers
        .filter((a) => a.score === 0)
        .flatMap((a) => a.tags)
    )
  );
  const weakestCategory = weakTags.length > 0 ? weakTags[0] : null;

  const previousPercentage: number | null = null;
  const isFirstTest = true;

  // Encouraging micro-copy based on score
  const encouragement =
    percentage >= 80
      ? "Hervorragend!"
      : percentage >= 60
        ? "Gut gemacht!"
        : percentage >= 40
          ? "Guter Anfang!"
          : "Jeder Test macht dich besser!";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-gray-950">
      <div className="mx-auto max-w-[480px] px-5">
        <ResultHeader
          mode={mode}
          questionCount={results.totalQuestions}
          date={new Date(results.completedAt)}
        />
        <ResultScore
          percentage={percentage}
          pointsEarned={results.totalScore}
          pointsTotal={results.maxScore}
          encouragement={encouragement}
        />
        <ResultDelta
          previousPercentage={previousPercentage}
          currentPercentage={percentage}
        />
        <ResultBreakdown
          fullPoints={fullPoints}
          partialPoints={partialPoints}
          noPoints={noPoints}
        />
        <ResultAnswers answers={results.answers} />
        <ResultVerdict
          passed={passed}
          requiredPoints={passScore}
          earnedPoints={results.totalScore}
          mode={mode}
        />
        <ResultCTA
          weakestCategory={weakestCategory}
          passed={passed}
          isFirstTest={isFirstTest}
          mode={mode}
        />
      </div>
    </div>
  );
}

// ─── ResultHeader ───

function ResultHeader({
  mode,
  questionCount,
  date,
}: {
  mode: Mode;
  questionCount: number;
  date: Date;
}) {
  const modeLabel = mode === "pruefung" ? "Pr\u00fcfungsmodus" : "\u00dcbungsmodus";
  const formattedDate = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-xs text-gray-400 text-center mt-12 leading-relaxed">
      <div>
        {modeLabel} &middot; {questionCount} Fragen
      </div>
      <div>{formattedDate}</div>
    </div>
  );
}

// ─── ResultScore ───

function ResultScore({
  percentage,
  pointsEarned,
  pointsTotal,
  encouragement,
}: {
  percentage: number;
  pointsEarned: number;
  pointsTotal: number;
  encouragement: string;
}) {
  return (
    <div>
      <div className="text-[72px] font-bold text-white text-center mt-4 leading-none tracking-tight">
        {percentage}%
      </div>
      <div className="text-sm text-accent text-center mt-2 font-medium">
        {encouragement}
      </div>
      <div className="text-sm text-gray-400 text-center mt-1 mb-8">
        {pointsEarned} von {pointsTotal} Punkten
      </div>
    </div>
  );
}

// ─── ResultDelta (conditional) ───

function ResultDelta({
  previousPercentage,
  currentPercentage,
}: {
  previousPercentage: number | null;
  currentPercentage: number;
}) {
  if (previousPercentage === null) return null;
  if (currentPercentage <= previousPercentage) return null;

  return (
    <div className="text-[13px] text-accent text-center font-medium -mt-4 mb-8">
      &#9650; Besser als dein letzter Test
    </div>
  );
}

// ─── ResultBreakdown ───

function ResultBreakdown({
  fullPoints,
  partialPoints,
  noPoints,
}: {
  fullPoints: number;
  partialPoints: number;
  noPoints: number;
}) {
  const items = [
    { count: fullPoints, label: "2 Punkte", dotColor: "bg-success" },
    { count: partialPoints, label: "1 Punkt", dotColor: "bg-warning" },
    { count: noPoints, label: "0 Punkte", dotColor: "bg-gray-500" },
  ];

  return (
    <div className="flex justify-between py-5 px-6 border-t border-b border-gray-800 -mx-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1.5"
        >
          <span className={cn("w-2 h-2 rounded-full", item.dotColor)} />
          <span className="text-2xl font-semibold text-white">
            {item.count}
          </span>
          <span className="text-[11px] text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ResultAnswers ───

function ResultAnswers({ answers }: { answers: RegeltestAnswerResult[] }) {
  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-white mb-4">
        Was du mitgenommen hast
      </h3>
      <div className="space-y-2">
        {answers.map((answer) => (
          <AnswerCard
            key={answer.questionIndex}
            questionNumber={answer.questionIndex + 1}
            questionText={answer.situation}
            userAnswer={answer.userAnswer || null}
            referenceAnswer={answer.correctAnswer}
            points={answer.score as 0 | 1 | 2}
            isApproximate={answer.score === 1}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AnswerCard ───

function AnswerCard({
  questionNumber,
  questionText,
  userAnswer,
  referenceAnswer,
  points,
  isApproximate,
}: {
  questionNumber: number;
  questionText: string;
  userAnswer: string | null;
  referenceAnswer: string;
  points: 0 | 1 | 2;
  isApproximate: boolean;
}) {
  const pointsConfig = {
    2: { dotColor: "bg-success", textColor: "text-success", label: "2 Pkt" },
    1: { dotColor: "bg-warning", textColor: "text-warning", label: "1 Pkt" },
    0: { dotColor: undefined, textColor: "text-gray-400", label: "0 Pkt" },
  } as const;
  const pc = pointsConfig[points];

  const borderColor =
    points === 2
      ? "border-l-success/30"
      : points === 1
        ? "border-l-warning/30"
        : "border-l-gray-700/30";

  return (
    <div className={cn(
      "bg-gray-800/60 rounded-[var(--radius-lg)] p-4 relative border-l-[3px]",
      borderColor
    )}>
      {/* Points indicator (top-right) */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {pc.dotColor && (
          <span className={cn("w-1.5 h-1.5 rounded-full", pc.dotColor)} />
        )}
        <span className={cn("text-[11px] font-medium", pc.textColor)}>
          {pc.label}
        </span>
      </div>

      {/* Situation label */}
      <div className="text-[11px] text-accent font-medium mb-1">
        Situation {questionNumber}
      </div>

      {/* Question text */}
      <div className="text-[13px] text-gray-300 leading-relaxed mb-3">
        {questionText}
      </div>

      {/* Separator */}
      <div className="border-t border-gray-700/40 my-3" />

      {/* User answer block */}
      <div>
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
          Deine Antwort
        </div>
        {userAnswer ? (
          <div className="text-sm text-white leading-relaxed">
            {userAnswer}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic leading-relaxed">
            (keine Antwort)
          </div>
        )}
        {isApproximate && (
          <span className="text-[10px] text-accent bg-accent-subtle rounded px-2 py-0.5 inline-block mt-1.5">
            Sinngem&auml;&szlig; richtig
          </span>
        )}
      </div>

      {/* Reference answer block */}
      <div className="mt-3">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
          Musterantwort
        </div>
        <div className="text-sm text-accent leading-relaxed">
          {referenceAnswer}
        </div>
      </div>
    </div>
  );
}

// ─── ResultVerdict (conditional: only pruefung mode) ───

function ResultVerdict({
  passed,
  requiredPoints,
  earnedPoints,
  mode,
}: {
  passed: boolean;
  requiredPoints: number;
  earnedPoints: number;
  mode: Mode;
}) {
  if (mode !== "pruefung") return null;

  return (
    <div className="mt-8">
      <div className="text-[13px] text-gray-400 text-center mb-2">
        Pr&uuml;fungsstand: {passed ? "Bestanden" : "Dieses Mal nicht bestanden"}
      </div>
      {!passed && (
        <div className="text-xs text-gray-400 text-center">
          Zum Bestehen ben&ouml;tigst du {requiredPoints} Punkte &mdash; du schaffst das!
        </div>
      )}
    </div>
  );
}

// ─── ResultCTA ───

function ResultCTA({
  weakestCategory,
  passed,
  isFirstTest,
  mode,
}: {
  weakestCategory: string | null;
  passed: boolean;
  isFirstTest: boolean;
  mode: Mode;
}) {
  const router = useRouter();

  let primaryLabel: string;
  let primaryRoute: string;

  if (isFirstTest) {
    primaryLabel = "Alle Kategorien ansehen";
    primaryRoute = "/dashboard/statistiken";
  } else if (weakestCategory && !passed) {
    primaryLabel = `${weakestCategory} jetzt trainieren`;
    primaryRoute = `/regeltest?tags=${encodeURIComponent(weakestCategory)}&mode=TEST`;
  } else if (passed) {
    primaryLabel = "Neue Pr\u00fcfung starten";
    primaryRoute = "/regeltest?mode=EXAM";
  } else {
    primaryLabel = "Weiter trainieren";
    primaryRoute = "/regeltest?mode=TEST";
  }

  return (
    <div className="mt-10 mb-12">
      <button
        onClick={() => router.push(primaryRoute)}
        className="w-full min-h-[48px] rounded-[var(--radius-xl)] bg-white text-gray-900 px-6 py-4 text-base font-semibold text-center transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
      >
        {primaryLabel}
      </button>
      <button
        onClick={() => router.push("/dashboard")}
        className="w-full min-h-[44px] text-[13px] text-gray-400 text-center mt-4 hover:text-gray-300 transition-colors bg-transparent border-none"
      >
        Zum Dashboard
      </button>
    </div>
  );
}
