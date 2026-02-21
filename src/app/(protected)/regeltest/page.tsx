import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
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
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <RegeltestClient initialMode={validMode} />
      </main>
    </div>
  );
}
