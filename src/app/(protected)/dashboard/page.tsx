import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-2xl font-bold text-text-primary">
          Willkommen, {displayName}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Wähle einen Modus und teste dein Regelwissen.
        </p>

        {/* Test Mode Cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link href="/regeltest?mode=EXAM" className="group block">
            <div className="rounded-[var(--radius-xl)] border border-border p-6 transition-all duration-150 hover:border-border-hover hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-exam-light">
                <span className="text-lg">⏱️</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary">Regeltest</h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                30 Fragen, 30 Sekunden pro Frage
              </p>
              <span className="mt-4 inline-block rounded-full bg-exam-light px-2.5 py-0.5 text-xs font-medium text-exam">
                Prüfungsmodus
              </span>
            </div>
          </Link>

          <Link href="/regeltest?mode=TEST" className="group block">
            <div className="rounded-[var(--radius-xl)] border border-border p-6 transition-all duration-150 hover:border-border-hover hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-test-light">
                <span className="text-lg">📝</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary">Übungstest</h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                15 Fragen, kein Zeitlimit
              </p>
              <span className="mt-4 inline-block rounded-full bg-test-light px-2.5 py-0.5 text-xs font-medium text-test">
                Testmodus
              </span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-14">
          <h3 className="text-base font-semibold text-text-primary">Deine Statistiken</h3>

          {totalTests === 0 ? (
            <p className="mt-3 text-sm text-text-tertiary">
              Starte deinen ersten Regeltest, um Statistiken zu sehen.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-[var(--radius-lg)] border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {totalTests}
                  </div>
                  <div className="text-xs text-text-tertiary">Tests</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-accent">
                    {averagePercent}%
                  </div>
                  <div className="text-xs text-text-tertiary">Durchschnitt</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-success">
                    {bestScore}%
                  </div>
                  <div className="text-xs text-text-tertiary">Bestleistung</div>
                </div>
              </div>

              {/* Recent sessions */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-text-primary">
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
                        className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              s.mode === "EXAM"
                                ? "bg-exam-light text-exam"
                                : "bg-test-light text-test"
                            }`}
                          >
                            {s.mode === "EXAM" ? "Prüfung" : "Übung"}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {s.completedAt
                              ? new Date(s.completedAt).toLocaleDateString(
                                  "de-DE"
                                )
                              : ""}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-text-primary">
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
      </main>
    </div>
  );
}
