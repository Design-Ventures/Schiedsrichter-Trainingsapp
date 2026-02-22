import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RegeltestClient } from "@/components/regeltest/RegeltestClient";
import type { RegeltestMode } from "@/types/regeltest";

interface RegeltestPageProps {
  searchParams: Promise<{ mode?: string; tags?: string }>;
}

export default async function RegeltestPage({ searchParams }: RegeltestPageProps) {
  const { mode, tags: tagsParam } = await searchParams;

  if (mode !== "EXAM" && mode !== "TEST") {
    redirect("/");
  }

  const validMode: RegeltestMode = mode;
  const tags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-6 sm:py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] text-[13px] sm:text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-5 sm:px-6 sm:py-6">
        <RegeltestClient initialMode={validMode} initialTags={tags} />
      </main>
    </div>
  );
}
