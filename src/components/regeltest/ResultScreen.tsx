"use client";

import { useRouter } from "next/navigation";
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

  // Placeholders until data tracking is implemented (Step 4 in brief)
  const previousPercentage: number | null = null;
  const isFirstTest = true;

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto"
      style={{ background: "#0A0A14" }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        <ResultHeader
          mode={mode}
          questionCount={results.totalQuestions}
          date={new Date(results.completedAt)}
        />
        <ResultScore
          percentage={percentage}
          pointsEarned={results.totalScore}
          pointsTotal={results.maxScore}
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
  const modeLabel = mode === "pruefung" ? "Prüfungsmodus" : "Übungsmodus";
  const formattedDate = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 48,
        fontWeight: 400,
        lineHeight: 1.6,
      }}
    >
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
}: {
  percentage: number;
  pointsEarned: number;
  pointsTotal: number;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: "#FFFFFF",
          textAlign: "center",
          marginTop: 16,
          lineHeight: 1,
          letterSpacing: -2,
        }}
      >
        {percentage}%
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#6B7280",
          textAlign: "center",
          marginTop: 8,
          marginBottom: 32,
        }}
      >
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
    <div
      style={{
        fontSize: 13,
        color: "#8B5CF6",
        textAlign: "center",
        fontWeight: 500,
        marginTop: -16,
        marginBottom: 32,
      }}
    >
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
    { count: fullPoints, label: "2 Punkte", dotColor: "#16A34A" },
    { count: partialPoints, label: "1 Punkt", dotColor: "#D97706" },
    { count: noPoints, label: "0 Punkte", dotColor: "#6B7280" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderTop: "1px solid #1F1F3A",
        borderBottom: "1px solid #1F1F3A",
        margin: "0 -20px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: item.dotColor,
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            {item.count}
          </div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ResultAnswers ───

function ResultAnswers({ answers }: { answers: RegeltestAnswerResult[] }) {
  return (
    <div style={{ marginTop: 32 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#FFFFFF",
          marginBottom: 16,
        }}
      >
        Was du mitgenommen hast
      </h3>
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
    2: { dotColor: "#16A34A", textColor: "#16A34A", label: "2 Pkt" },
    1: { dotColor: "#D97706", textColor: "#D97706", label: "1 Pkt" },
    0: { dotColor: undefined, textColor: "#6B7280", label: "0 Pkt" },
  } as const;
  const pc = pointsConfig[points];

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        position: "relative",
      }}
    >
      {/* Points indicator (top-right) */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {pc.dotColor && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: pc.dotColor,
            }}
          />
        )}
        <span style={{ fontSize: 11, fontWeight: 500, color: pc.textColor }}>
          {pc.label}
        </span>
      </div>

      {/* Situation label */}
      <div
        style={{
          fontSize: 11,
          color: "#8B5CF6",
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        Situation {questionNumber}
      </div>

      {/* Question text */}
      <div
        style={{
          fontSize: 13,
          color: "#9CA3AF",
          fontWeight: 400,
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        {questionText}
      </div>

      {/* User answer block */}
      <div>
        <div
          style={{
            fontSize: 10,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Deine Antwort
        </div>
        {userAnswer ? (
          <div
            style={{
              fontSize: 14,
              color: "#FFFFFF",
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {userAnswer}
          </div>
        ) : (
          <div
            style={{
              fontSize: 14,
              color: "#4B5563",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            (keine Antwort)
          </div>
        )}
        {isApproximate && (
          <span
            style={{
              fontSize: 10,
              color: "#8B5CF6",
              background: "#1E1B4B",
              borderRadius: 4,
              padding: "2px 8px",
              display: "inline-block",
              marginTop: 6,
            }}
          >
            Sinngemäß richtig
          </span>
        )}
      </div>

      {/* Reference answer block */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: 10,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Musterantwort
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#8B5CF6",
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
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
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          fontWeight: 400,
          marginBottom: 8,
        }}
      >
        Prüfungsstand: {passed ? "Bestanden" : "Nicht bestanden"}
      </div>
      {!passed && (
        <div
          style={{
            fontSize: 12,
            color: "#4B5563",
            textAlign: "center",
          }}
        >
          Zum Bestehen benötigst du {requiredPoints} Punkte
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
    primaryLabel = "Neue Prüfung starten";
    primaryRoute = "/regeltest?mode=EXAM";
  } else {
    primaryLabel = "Weiter trainieren";
    primaryRoute = "/regeltest?mode=TEST";
  }

  return (
    <div>
      <button
        onClick={() => router.push(primaryRoute)}
        className="min-h-[44px]"
        style={{
          background: "#FFFFFF",
          color: "#000000",
          borderRadius: 14,
          padding: "16px 24px",
          width: "100%",
          fontSize: 16,
          fontWeight: 600,
          textAlign: "center",
          marginTop: 40,
          cursor: "pointer",
          border: "none",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF")
        }
      >
        {primaryLabel}
      </button>
      <button
        onClick={() => router.push("/dashboard")}
        className="min-h-[44px]"
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          marginTop: 16,
          marginBottom: 48,
          display: "block",
          width: "100%",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        Dashboard
      </button>
    </div>
  );
}
