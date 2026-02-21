import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-surface-raised">
      {/* Header */}
      <header className="border-b border-border bg-surface glass sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-text-primary">
            <span className="text-primary">SR</span> Trainingsapp
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-text-primary">
          Willkommen, {displayName}!
        </h2>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link href="/regeltest?mode=EXAM" className="block">
            <Card>
              <CardHeader>
                <CardTitle>Regeltest starten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  30 Fragen, 30 Sekunden pro Frage, max. 60 Punkte
                </p>
                <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark">
                  Prüfungsmodus
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/regeltest?mode=TEST" className="block">
            <Card>
              <CardHeader>
                <CardTitle>Übungstest starten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  15 Fragen, kein Zeitlimit, max. 30 Punkte
                </p>
                <span className="mt-3 inline-block rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-dark">
                  Testmodus
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Deine Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            {totalTests === 0 ? (
              <p className="text-sm text-text-tertiary">
                Starte deinen ersten Regeltest, um Statistiken zu sehen.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {totalTests}
                    </div>
                    <div className="text-xs text-text-tertiary">Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {averagePercent}%
                    </div>
                    <div className="text-xs text-text-tertiary">Durchschnitt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-dark">
                      {bestScore}%
                    </div>
                    <div className="text-xs text-text-tertiary">Bestleistung</div>
                  </div>
                </div>

                {/* Recent sessions */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-text-primary">
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
                          className="flex items-center justify-between rounded-[--radius-lg] bg-surface-raised px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-secondary">
                              {s.mode === "EXAM"
                                ? "Prüfung"
                                : "Übung"}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
