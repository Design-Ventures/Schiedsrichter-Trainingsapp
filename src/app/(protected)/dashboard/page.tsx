import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.name || user?.email || "Nutzer";

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

        {/* Placeholder stats */}
        <Card>
          <CardHeader>
            <CardTitle>Deine Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Starte deinen ersten Regeltest, um Statistiken zu sehen.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
