import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

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

export default async function StatistikenPage() {
  const user = await getAuthenticatedUser();

  const answers = user
    ? await prisma.regeltestAnswer.findMany({
        where: {
          session: { userId: user.id, isEvaluated: true },
        },
        select: {
          score: true,
          question: { select: { tags: true } },
        },
      })
    : [];

  // Aggregate per tag
  const tagMap = new Map<
    string,
    { totalAnswered: number; totalScore: number; scores: [number, number, number] }
  >();

  for (const answer of answers) {
    for (const tag of answer.question.tags) {
      const entry = tagMap.get(tag) ?? {
        totalAnswered: 0,
        totalScore: 0,
        scores: [0, 0, 0] as [number, number, number],
      };
      entry.totalAnswered++;
      entry.totalScore += answer.score;
      entry.scores[answer.score]++;
      tagMap.set(tag, entry);
    }
  }

  const tagStats: TagStats[] = Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      totalAnswered: data.totalAnswered,
      totalScore: data.totalScore,
      maxScore: data.totalAnswered * 2,
      percent: Math.round((data.totalScore / (data.totalAnswered * 2)) * 100),
      scores: data.scores,
    }))
    .sort((a, b) => a.percent - b.percent);

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

      {tagStats.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-xl)] border border-border px-6 py-10 sm:py-14 text-center">
          <p className="mx-auto max-w-[20rem] text-[13px] sm:text-sm text-text-tertiary text-pretty">
            Absolviere deinen ersten Regeltest, um deine Stärken und Schwächen pro Kategorie zu sehen.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block">
            <Button>Zum Dashboard</Button>
          </Link>
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

              {/* Score distribution */}
              <div className="mt-2 flex gap-3 text-[11px] text-text-tertiary">
                <span>{t.scores[2]}x volle Punkte</span>
                <span>{t.scores[1]}x teilweise</span>
                <span>{t.scores[0]}x keine</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
