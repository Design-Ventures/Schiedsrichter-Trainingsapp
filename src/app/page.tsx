import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-2px)] flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Logo />
        <Link
          href="/login"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Anmelden
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]">
            Teste dein Regelwissen
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto leading-relaxed">
            Trainiere mit echten Prüfungsfragen und erhalte sofortiges KI-Feedback zu deinen Antworten.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-[--radius-lg] bg-primary px-6 py-2.5 text-[15px] font-medium text-white transition-all duration-150 hover:bg-primary-hover w-full sm:w-auto"
            >
              Kostenlos starten
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[--radius-lg] border border-border px-6 py-2.5 text-[15px] font-medium text-text-primary transition-all duration-150 hover:bg-gray-50 w-full sm:w-auto"
            >
              Anmelden
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[--radius-lg] bg-accent-subtle">
              <span className="text-lg">📝</span>
            </div>
            <div className="text-sm font-medium text-text-primary">571 Fragen</div>
            <div className="text-xs text-text-tertiary mt-0.5">Aus SR-Zeitungen</div>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[--radius-lg] bg-exam-light">
              <span className="text-lg">⏱️</span>
            </div>
            <div className="text-sm font-medium text-text-primary">Prüfungsmodus</div>
            <div className="text-xs text-text-tertiary mt-0.5">30 Sek. pro Frage</div>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[--radius-lg] bg-info-light">
              <span className="text-lg">🤖</span>
            </div>
            <div className="text-sm font-medium text-text-primary">KI-Bewertung</div>
            <div className="text-xs text-text-tertiary mt-0.5">Sofortiges Feedback</div>
          </div>
        </div>
      </main>
    </div>
  );
}
