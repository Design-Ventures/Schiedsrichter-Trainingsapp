import { redirect } from "next/navigation";
import Link from "next/link";
import { RegeltestClient } from "@/components/regeltest/RegeltestClient";
import type { RegeltestMode } from "@/types/regeltest";

interface RegeltestPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function RegeltestPage({ searchParams }: RegeltestPageProps) {
  const { mode } = await searchParams;

  if (mode !== "EXAM" && mode !== "TEST") {
    redirect("/dashboard");
  }

  const validMode: RegeltestMode = mode;

  return (
    <div className="min-h-screen bg-dfb-gray">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-dfb-dark">
            <span className="text-dfb-green">SR</span> Regeltest
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-dfb-green"
          >
            Abbrechen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <RegeltestClient initialMode={validMode} />
      </main>
    </div>
  );
}
