import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Regelkategorien | schiri.app",
};

interface TagStats {
  tag: string;
  totalAnswered: number;
  totalScore: number;
  maxScore: number;
  percent: number;
  scores: [number, number, number];
}

interface TagRow {
  tag: string;
  total_answered: bigint;
  total_score: bigint;
  score_0: bigint;
  score_1: bigint;
  score_2: bigint;
}

export default async function StatistikenPage() {
  const user = await getAuthenticatedUser();

  // Single SQL query: unnest tags, aggregate per tag, sort by weakest
  const rows: TagRow[] = user
    ? await prisma.$queryRaw<TagRow[]>`
        SELECT
          unnest(q.tags) AS tag,
          COUNT(*)::bigint AS total_answered,
          SUM(a.score)::bigint AS total_score,
          SUM(CASE WHEN a.score = 0 THEN 1 ELSE 0 END)::bigint AS score_0,
          SUM(CASE WHEN a.score = 1 THEN 1 ELSE 0 END)::bigint AS score_1,
          SUM(CASE WHEN a.score = 2 THEN 1 ELSE 0 END)::bigint AS score_2
        FROM regeltest_answers a
        JOIN regeltest_sessions s ON a."sessionId" = s.id
        JOIN regeltest_questions q ON a."questionId" = q.id
        WHERE s."userId" = ${user.id} AND s."isEvaluated" = true
        GROUP BY tag
        ORDER BY SUM(a.score)::float / (COUNT(*) * 2) ASC
      `
    : [];

  // Session history for sparkline (last 20, oldest first)
  const sessions = user
    ? await prisma.regeltestSession.findMany({
        where: { userId: user.id, isEvaluated: true },
        orderBy: { completedAt: "asc" },
        take: 20,
        select: { totalScore: true, maxScore: true, completedAt: true },
      })
    : [];

  const sessionPercents = sessions.map((s) =>
    Math.round((s.totalScore / s.maxScore) * 100)
  );

  const tagStats: TagStats[] = rows.map((r) => {
    const totalAnswered = Number(r.total_answered);
    const totalScore = Number(r.total_score);
    const maxScore = totalAnswered * 2;
    return {
      tag: r.tag,
      totalAnswered,
      totalScore,
      maxScore,
      percent: Math.round((totalScore / maxScore) * 100),
      scores: [Number(r.score_0), Number(r.score_1), Number(r.score_2)],
    };
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="-ml-0.5 inline-flex items-center gap-1 text-[13px] sm:text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-text-primary">
            Regelkategorien
          </h2>
        </div>
        <p className="hidden sm:block text-[13px] text-text-tertiary text-right max-w-[14rem]">
          Sortiert nach Trefferquote — Schwächen stehen oben
        </p>
      </div>

      {/* Sparkline progress card */}
      {sessionPercents.length >= 2 && (() => {
        const avg = Math.round(
          sessionPercents.reduce((a, b) => a + b, 0) / sessionPercents.length
        );
        const recent3 = sessionPercents.slice(-3);
        const first3 = sessionPercents.slice(0, 3);
        const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
        const firstAvg = first3.reduce((a, b) => a + b, 0) / first3.length;
        const trend = Math.round(recentAvg - firstAvg);

        // SVG sparkline coordinates
        const w = 120;
        const h = 40;
        const pad = 2;
        const n = sessionPercents.length;
        const points = sessionPercents
          .map((pct, i) => {
            const x = pad + (i / (n - 1)) * (w - pad * 2);
            const y = h - pad - (pct / 100) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
        const lastPct = sessionPercents[n - 1];
        const lastX = w - pad;
        const lastY = h - pad - (lastPct / 100) * (h - pad * 2);
        // Fill area under the line
        const fillPoints = `${pad},${h - pad} ${points} ${lastX.toFixed(1)},${h - pad}`;

        return (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-border px-4 py-3 sm:px-5 sm:py-4">
            <h3 className="text-[13px] sm:text-sm font-medium text-text-secondary mb-3">
              Dein Verlauf
            </h3>
            <div className="flex items-center gap-5 sm:gap-6">
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="h-10 w-[120px] shrink-0"
                aria-hidden="true"
              >
                <polygon
                  points={fillPoints}
                  className="fill-accent/10"
                />
                <polyline
                  points={points}
                  fill="none"
                  className="stroke-accent"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={lastX}
                  cy={lastY}
                  r="3"
                  className="fill-accent"
                />
              </svg>
              <div className="flex items-baseline gap-4 sm:gap-5">
                <div>
                  <span className="text-lg sm:text-xl font-bold text-text-primary">
                    {avg}%
                  </span>
                  <span className="ml-1 text-[11px] sm:text-xs text-text-tertiary">
                    Schnitt
                  </span>
                </div>
                {sessionPercents.length >= 3 && trend !== 0 && (
                  <div>
                    <span
                      className={`text-[13px] sm:text-sm font-semibold ${
                        trend > 0 ? "text-success-text" : "text-error"
                      }`}
                    >
                      {trend > 0 ? "+" : ""}{trend}%
                    </span>
                    <span className="ml-1 text-[11px] sm:text-xs text-text-tertiary">
                      Trend
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[13px] sm:text-sm font-semibold text-text-primary">
                    {sessionPercents.length}
                  </span>
                  <span className="ml-1 text-[11px] sm:text-xs text-text-tertiary">
                    Tests
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {tagStats.length === 0 ? (
        <div className="mt-10 space-y-6">
          <div className="rounded-[var(--radius-xl)] border border-border px-6 py-10 sm:py-14 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">
              Finde heraus, wo du stehst
            </h3>
            <p className="mx-auto mt-2 max-w-[22rem] text-[13px] sm:text-sm text-text-secondary text-pretty leading-relaxed">
              Mach deinen ersten Regeltest — danach siehst du hier deine Stärken und Schwächen pro Kategorie.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
              <Link href="/regeltest?mode=EXAM" className="group block">
                <div className="rounded-[var(--radius-lg)] border border-border p-4 transition-all duration-150 hover:border-border-hover hover:shadow-md text-left">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-exam-light">
                    <span className="text-sm">⏱️</span>
                  </div>
                  <h4 className="text-[13px] sm:text-sm font-semibold text-text-primary">Regeltest</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-text-tertiary">30 Fragen, 30 Sek. pro Frage</p>
                </div>
              </Link>
              <Link href="/regeltest?mode=TEST" className="group block">
                <div className="rounded-[var(--radius-lg)] border border-border p-4 transition-all duration-150 hover:border-border-hover hover:shadow-md text-left">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-test-light">
                    <span className="text-sm">📝</span>
                  </div>
                  <h4 className="text-[13px] sm:text-sm font-semibold text-text-primary">Übungstest</h4>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-text-tertiary">15 Fragen, kein Zeitlimit</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {tagStats.map((t) => (
            <div
              key={t.tag}
              className="rounded-[var(--radius-lg)] border border-border px-4 py-3 sm:px-5 sm:py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] sm:text-sm font-medium text-text-primary truncate">
                  {t.tag}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] sm:text-xs text-text-tertiary">
                    {t.totalAnswered} Fragen
                  </span>
                  <span className="text-[13px] sm:text-sm font-semibold text-text-primary">
                    {t.percent}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-2 rounded-full bg-fill-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${t.percent}%` }}
                />
              </div>

              {/* Score distribution + practice link */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex gap-3 text-[11px] text-text-tertiary">
                  <span>{t.scores[2]}x volle Punkte</span>
                  <span>{t.scores[1]}x teilweise</span>
                  <span>{t.scores[0]}x keine</span>
                </div>
                {t.percent < 80 && (
                  <Link
                    href={`/regeltest?mode=TEST&tags=${encodeURIComponent(t.tag)}`}
                    className="shrink-0 text-[11px] sm:text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    Üben &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
