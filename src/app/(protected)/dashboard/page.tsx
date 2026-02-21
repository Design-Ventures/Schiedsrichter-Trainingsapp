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
    <div className="min-h-screen bg-dfb-gray">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-dfb-dark">
            <span className="text-dfb-green">SR</span> Trainingsapp
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-dfb-dark">
          Willkommen, {displayName}!
        </h2>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link href="/regeltest?mode=EXAM" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Regeltest starten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  30 Fragen, 30 Sekunden pro Frage, max. 60 Punkte
                </p>
                <span className="mt-3 inline-block rounded-full bg-dfb-green/10 px-3 py-1 text-sm font-medium text-dfb-green">
                  Prüfungsmodus
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/regeltest?mode=TEST" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Übungstest starten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  15 Fragen, kein Zeitlimit, max. 30 Punkte
                </p>
                <span className="mt-3 inline-block rounded-full bg-dfb-gold/20 px-3 py-1 text-sm font-medium text-dfb-gold-dark">
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
              <p className="text-sm text-gray-500">
                Starte deinen ersten Regeltest, um Statistiken zu sehen.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-dfb-dark">
                      {totalTests}
                    </div>
                    <div className="text-xs text-gray-500">Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-dfb-green">
                      {averagePercent}%
                    </div>
                    <div className="text-xs text-gray-500">Durchschnitt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-dfb-gold-dark">
                      {bestScore}%
                    </div>
                    <div className="text-xs text-gray-500">Bestleistung</div>
                  </div>
                </div>

                {/* Recent sessions */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-dfb-dark">
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
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                              {s.mode === "EXAM"
                                ? "Prüfung"
                                : "Übung"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {s.completedAt
                                ? new Date(s.completedAt).toLocaleDateString(
                                    "de-DE"
                                  )
                                : ""}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-dfb-dark">
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
