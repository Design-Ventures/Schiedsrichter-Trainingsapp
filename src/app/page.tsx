import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  const questionCount = await prisma.regeltestQuestion.count({
    where: { isActive: true },
  });
  return (
    <div className="flex min-h-[calc(100vh-2px)] flex-col">
      {/* Nav — compact like Luma: tight padding, pill-style sign-in */}
      <nav className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4">
        <Logo />
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-border px-3.5 py-1 min-h-[44px] text-[13px] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
        >
          Anmelden
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-text-primary leading-[1.15] sm:leading-[1.1]">
            Werde sicher
            <br />
            in den Regeln.
          </h1>
          <p className="mt-4 sm:mt-6 text-[15px] sm:text-lg text-text-secondary max-w-xs sm:max-w-sm mx-auto leading-relaxed">
            Trainiere mit echten Prüfungsfragen und erhalte sofort detailliertes Feedback zu deinen Antworten.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-primary px-6 py-2.5 min-h-[44px] text-[15px] font-medium text-text-on-primary transition-all duration-150 hover:bg-primary-hover w-full sm:w-auto"
            >
              Kostenlos starten
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-border px-6 py-2.5 min-h-[44px] text-[15px] font-medium text-text-primary transition-all duration-150 hover:bg-fill-hover w-full sm:w-auto"
            >
              Anmelden
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-14 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-sm sm:max-w-2xl w-full">
          <div className="text-center">
            <div className="mx-auto mb-2 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent-subtle">
              <span className="text-base sm:text-lg">📝</span>
            </div>
            <div className="text-[13px] sm:text-sm font-medium text-text-primary">{questionCount} Fragen</div>
            <div className="text-[11px] sm:text-xs text-text-tertiary mt-0.5">Aus SR-Zeitungen</div>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius-lg)] bg-exam-light">
              <span className="text-base sm:text-lg">⏱️</span>
            </div>
            <div className="text-[13px] sm:text-sm font-medium text-text-primary">Prüfungsmodus</div>
            <div className="text-[11px] sm:text-xs text-text-tertiary mt-0.5">30 Sek. pro Frage</div>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius-lg)] bg-info-light">
              <span className="text-base sm:text-lg">✨</span>
            </div>
            <div className="text-[13px] sm:text-sm font-medium text-text-primary">Sofort-Bewertung</div>
            <div className="text-[11px] sm:text-xs text-text-tertiary mt-0.5">Detailliertes Feedback</div>
          </div>
        </div>
      </main>
    </div>
  );
}
