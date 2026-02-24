import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedList } from "@/components/ui/animated-list";

export const metadata = {
  title: "Dashboard | schiri.app",
};

interface TagRow {
  tag: string;
  total_answered: bigint;
  total_score: bigint;
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  // 1. Sessions (desc for recent list, we reverse for sparkline)
  const sessions = user
    ? await prisma.regeltestSession.findMany({
        where: { userId: user.id, isEvaluated: true },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          mode: true,
          totalScore: true,
          maxScore: true,
          completedAt: true,
        },
      })
    : [];

  // 2. Weak categories (top 3 weakest)
  const tagRows: TagRow[] = user
    ? await prisma.$queryRaw<TagRow[]>`
        SELECT
          unnest(q.tags) AS tag,
          COUNT(*)::bigint AS total_answered,
          SUM(a.score)::bigint AS total_score
        FROM regeltest_answers a
        JOIN regeltest_sessions s ON a."sessionId" = s.id
        JOIN regeltest_questions q ON a."questionId" = q.id
        WHERE s."userId" = ${user.id} AND s."isEvaluated" = true
        GROUP BY tag
        ORDER BY SUM(a.score)::float / (COUNT(*) * 2) ASC
      `
    : [];

  // 3. Derived data
  const totalTests = sessions.length;
  const percents = sessions.map((s) =>
    Math.round((s.totalScore / s.maxScore) * 100)
  );
  const averagePercent =
    totalTests > 0
      ? Math.round(percents.reduce((a, b) => a + b, 0) / totalTests)
      : 0;

  // Sparkline: last 10 scores, chronological order
  const sparklineData = percents.slice(0, 10).reverse();

  // Trend: compare last 3 avg vs first 3 avg
  let trend = 0;
  if (sparklineData.length >= 4) {
    const first3 = sparklineData.slice(0, 3);
    const last3 = sparklineData.slice(-3);
    const firstAvg = first3.reduce((a, b) => a + b, 0) / first3.length;
    const lastAvg = last3.reduce((a, b) => a + b, 0) / last3.length;
    trend = Math.round(lastAvg - firstAvg);
  }

  // Category stats
  const categories = tagRows.map((r) => {
    const totalAnswered = Number(r.total_answered);
    const totalScore = Number(r.total_score);
    const maxScore = totalAnswered * 2;
    return {
      tag: r.tag,
      percent: Math.round((totalScore / maxScore) * 100),
    };
  });
  const weakCategories = categories.filter((c) => c.percent < 70).slice(0, 3);
  const weakestCategory = weakCategories[0];

  // Recent sessions (last 5)
  const recentSessions = sessions.slice(0, 5);

  // Smart CTA logic
  const allAbove70 =
    categories.length > 0 && categories.every((c) => c.percent >= 70);
  let primaryCta: { label: string; href: string };
  let secondaryCta: { label: string; href: string } | null = null;

  if (totalTests === 0) {
    primaryCta = { label: "Regeltest starten", href: "/regeltest?mode=EXAM" };
    secondaryCta = { label: "Erst \u00fcben \u2192", href: "/regeltest?mode=TEST" };
  } else if (weakestCategory) {
    primaryCta = {
      label: `${weakestCategory.tag} trainieren`,
      href: `/regeltest?mode=TEST&tags=${encodeURIComponent(weakestCategory.tag)}`,
    };
    secondaryCta = { label: "Pr\u00fcfung starten", href: "/regeltest?mode=EXAM" };
  } else if (allAbove70) {
    primaryCta = {
      label: "Neue Pr\u00fcfung starten",
      href: "/regeltest?mode=EXAM",
    };
    secondaryCta = { label: "\u00dcben \u2192", href: "/regeltest?mode=TEST" };
  } else {
    primaryCta = {
      label: "Weiter trainieren",
      href: "/regeltest?mode=TEST",
    };
    secondaryCta = {
      label: "Pr\u00fcfung starten \u2192",
      href: "/regeltest?mode=EXAM",
    };
  }

  // SVG sparkline
  const sparklineSvg = (() => {
    if (sparklineData.length < 2) return null;
    const w = 200;
    const h = 40;
    const pad = 4;
    const n = sparklineData.length;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    const coords = sparklineData.map((pct, i) => ({
      x: pad + (i / (n - 1)) * (w - pad * 2),
      y: h - pad - ((pct - min) / range) * (h - pad * 2),
    }));
    const points = coords
      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
    const last = coords[n - 1];

    return { w, h, points, lastX: last.x, lastY: last.y };
  })();

  // Empty state
  if (totalTests === 0) {
    return (
      <div className="flex flex-col items-center pt-20 sm:pt-28">
        <h2 className="text-2xl font-bold text-text-primary text-center text-pretty">
          Bereit loszulegen?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Finde heraus, wo du stehst.
        </p>

        <div className="mt-8 space-y-1 text-center">
          <p className="text-sm text-text-secondary leading-[1.8]">
            30 Spielsituationen.
          </p>
          <p className="text-sm text-text-secondary leading-[1.8]">
            Antwort in Freitext.
          </p>
          <p className="text-sm text-text-secondary leading-[1.8]">
            Sofortiges Feedback.
          </p>
        </div>

        <div className="mt-10 w-full max-w-sm">
          <Link
            href={primaryCta.href}
            className="flex items-center justify-center w-full rounded-[var(--radius-xl)] bg-primary px-6 py-3.5 text-base font-semibold text-text-on-primary min-h-[44px] transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] hover:shadow-[var(--shadow-button-hover)]"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="mt-4 text-center text-[13px] text-text-tertiary hover:text-text-secondary transition-colors min-h-[44px] flex items-center justify-center"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Encouraging micro-copy based on performance
  const encouragement =
    averagePercent >= 80
      ? "Stark! Weiter so."
      : averagePercent >= 60
        ? "Guter Start. Du wirst besser."
        : "Jeder Test macht dich besser.";

  // Populated state
  return (
    <>
      {/* Zone 1 — The Number */}
      <div className="flex flex-col items-center pt-12 sm:pt-20 pb-10">
        <AnimatedNumber
          value={averagePercent}
          suffix="%"
          className="text-[72px] font-bold text-text-primary leading-none tracking-tighter"
        />

        <span className="mt-3 text-sm text-text-secondary">
          {encouragement}
        </span>

        <span className="mt-1 text-[13px] text-text-tertiary">
          Dein Durchschnitt
          {totalTests > 1 && ` \u00b7 aus ${totalTests} Tests`}
        </span>

        {trend !== 0 && (
          <span className="mt-1.5 text-[13px] text-text-tertiary">
            {trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}%
          </span>
        )}

        {/* Micro-sparkline */}
        {sparklineSvg && (
          <svg
            viewBox={`0 0 ${sparklineSvg.w} ${sparklineSvg.h}`}
            className="mt-5 h-10 w-[200px]"
            aria-hidden="true"
          >
            <polyline
              points={sparklineSvg.points}
              fill="none"
              className={trend > 0 ? "stroke-warm" : "stroke-accent"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={sparklineSvg.lastX}
              cy={sparklineSvg.lastY}
              r="3"
              className={trend > 0 ? "fill-warm" : "fill-accent"}
            />
          </svg>
        )}
      </div>

      {/* Zone 2 — The Action */}
      <div className="w-full max-w-sm mx-auto">
        <Link
          href={primaryCta.href}
          className="flex items-center justify-center w-full rounded-[var(--radius-xl)] bg-primary px-6 py-3.5 text-base font-semibold text-text-on-primary min-h-[44px] transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] hover:shadow-[var(--shadow-button-hover)]"
        >
          {primaryCta.label}
        </Link>
        {secondaryCta && (
          <Link
            href={secondaryCta.href}
            className="mt-4 text-center text-[13px] text-text-tertiary hover:text-text-secondary transition-colors min-h-[44px] flex items-center justify-center"
          >
            {secondaryCta.label}
          </Link>
        )}
      </div>

      {/* Zone 3 — The Context */}
      <div className="mt-12 border-t border-border pt-10">
        {/* Weak categories */}
        {weakCategories.length > 0 && (
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Deine Schw&auml;chen
            </h3>

            <div className="mt-4 space-y-5">
              {weakCategories.map((cat) => (
                <Link
                  key={cat.tag}
                  href={`/regeltest?mode=TEST&tags=${encodeURIComponent(cat.tag)}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-text-primary group-hover:text-accent transition-colors">
                      {cat.tag}
                    </span>
                    <span className="text-[13px] font-semibold text-text-primary">
                      {cat.percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-fill-tertiary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${cat.percent < 50 ? "bg-warm" : "bg-accent"}`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/dashboard/statistiken"
              className="mt-5 inline-block text-[13px] text-text-tertiary hover:text-text-secondary transition-colors min-h-[44px] flex items-center"
            >
              Alle Kategorien &rarr;
            </Link>
          </section>
        )}

        {/* If no weak categories but has data, still link to statistiken */}
        {weakCategories.length === 0 && categories.length > 0 && (
          <section>
            <Link
              href="/dashboard/statistiken"
              className="inline-block text-[13px] text-text-tertiary hover:text-text-secondary transition-colors min-h-[44px] flex items-center"
            >
              Alle Kategorien &rarr;
            </Link>
          </section>
        )}

        {/* Recent tests */}
        {recentSessions.length > 0 && (
          <section className={weakCategories.length > 0 || categories.length > 0 ? "mt-10" : ""}>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Letzte Tests
            </h3>

            <div className="mt-4 space-y-3">
              {recentSessions.map((s) => {
                const pct = Math.round(
                  (s.totalScore / s.maxScore) * 100
                );
                const dateStr = s.completedAt
                  ? new Date(s.completedAt).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "short",
                    })
                  : "";
                const dotColor =
                  pct >= 80
                    ? "bg-success"
                    : pct >= 60
                      ? "bg-warning"
                      : "bg-error";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between min-h-[44px]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-text-tertiary w-16">
                        {dateStr}
                      </span>
                      <span className="text-[13px] text-text-secondary">
                        {s.mode === "EXAM" ? "Pr\u00fcfung" : "\u00dcbung"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-text-primary">
                        {s.totalScore}/{s.maxScore}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        <span className="text-[13px] font-semibold text-text-primary w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
