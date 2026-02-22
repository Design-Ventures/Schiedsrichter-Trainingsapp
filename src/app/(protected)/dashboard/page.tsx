import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Dashboard | schiri.app",
};

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  const displayName = user?.user_metadata?.name || user?.email || "Nutzer";

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

  const totalTests = sessions.length;
  const averagePercent =
    totalTests > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.totalScore / s.maxScore) * 100, 0) /
            totalTests
        )
      : 0;
  const bestScore =
    totalTests > 0
      ? Math.max(
          ...sessions.map((s) => Math.round((s.totalScore / s.maxScore) * 100))
        )
      : 0;
  const recentSessions = sessions.slice(0, 5);

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
        Willkommen, {displayName}
      </h2>
      <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-sm text-text-secondary">
        Wähle einen Modus und teste dein Regelwissen.
      </p>

      {/* Test Mode Cards */}
      <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2">
        <Link href="/regeltest?mode=EXAM" className="group block">
          <div className="rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 transition-all duration-150 hover:border-border-hover hover:shadow-md">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius-lg)] bg-exam-light">
              <span className="text-base sm:text-lg">⏱️</span>
            </div>
            <h3 className="text-[15px] sm:text-base font-semibold text-text-primary">Regeltest</h3>
            <p className="mt-1 sm:mt-1.5 text-[13px] sm:text-sm text-text-secondary leading-relaxed">
              30 Fragen, 30 Sekunden pro Frage
            </p>
            <span className="mt-3 sm:mt-4 inline-block rounded-full bg-exam-light px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-exam">
              Prüfungsmodus
            </span>
          </div>
        </Link>

        <Link href="/regeltest?mode=TEST" className="group block">
          <div className="rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 transition-all duration-150 hover:border-border-hover hover:shadow-md">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius-lg)] bg-test-light">
              <span className="text-base sm:text-lg">📝</span>
            </div>
            <h3 className="text-[15px] sm:text-base font-semibold text-text-primary">Übungstest</h3>
            <p className="mt-1 sm:mt-1.5 text-[13px] sm:text-sm text-text-secondary leading-relaxed">
              15 Fragen, kein Zeitlimit
            </p>
            <span className="mt-3 sm:mt-4 inline-block rounded-full bg-test-light px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-test">
              Testmodus
            </span>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10 sm:mt-14">
        <h3 className="text-[15px] sm:text-base font-semibold text-text-primary">Deine Statistiken</h3>

        {totalTests === 0 ? (
          <p className="mt-3 text-[13px] sm:text-sm text-text-tertiary">
            Starte deinen ersten Regeltest, um Statistiken zu sehen.
          </p>
        ) : (
          <div className="mt-4 space-y-5 sm:space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-[var(--radius-lg)] border border-border p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-text-primary">
                  {totalTests}
                </div>
                <div className="text-[11px] sm:text-xs text-text-tertiary">Tests</div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-accent-text">
                  {averagePercent}%
                </div>
                <div className="text-[11px] sm:text-xs text-text-tertiary">Durchschnitt</div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-success-text">
                  {bestScore}%
                </div>
                <div className="text-[11px] sm:text-xs text-text-tertiary">Bestleistung</div>
              </div>
            </div>

            {/* Link to category stats */}
            <Link
              href="/dashboard/statistiken"
              className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] hover:border-border-hover hover:shadow-sm transition-all"
            >
              <span className="text-[13px] sm:text-sm font-medium text-text-primary">Statistiken nach Kategorie</span>
              <span className="text-[13px] sm:text-sm text-text-tertiary">&rarr;</span>
            </Link>

            {/* Recent sessions */}
            <div>
              <h4 className="mb-2.5 sm:mb-3 text-[13px] sm:text-sm font-medium text-text-primary">
                Letzte Ergebnisse
              </h4>
              <div className="space-y-2">
                {recentSessions.map((s) => {
                  const pct = Math.round(
                    (s.totalScore / s.maxScore) * 100
                  );
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-medium ${
                            s.mode === "EXAM"
                              ? "bg-exam-light text-exam"
                              : "bg-test-light text-test"
                          }`}
                        >
                          {s.mode === "EXAM" ? "Prüfung" : "Übung"}
                        </span>
                        <span className="text-[11px] sm:text-xs text-text-tertiary">
                          {s.completedAt
                            ? new Date(s.completedAt).toLocaleDateString(
                                "de-DE"
                              )
                            : ""}
                        </span>
                      </div>
                      <span className="text-[13px] sm:text-sm font-semibold text-text-primary">
                        {s.totalScore}/{s.maxScore} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
