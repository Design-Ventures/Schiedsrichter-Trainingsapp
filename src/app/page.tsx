import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default async function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4">
        <Logo />
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-border px-3.5 py-1 min-h-[44px] text-[13px] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
        >
          Anmelden
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-xl text-center">
          <h1 className="text-[32px] sm:text-[56px] font-bold text-text-primary leading-[1.1]">
            Werde ein besserer
            <br />
            Schiedsrichter.
          </h1>
          <p className="mt-5 sm:mt-7 text-[15px] sm:text-lg text-text-secondary max-w-md mx-auto leading-relaxed text-pretty">
            Echte Pr&uuml;fungsfragen aus der DFB Schiedsrichter-Zeitung mit sofortigem Feedback nach jeder Antwort.
          </p>

          <div className="mt-10 sm:mt-12 flex flex-col items-center gap-2">
            <Link
              href="/regeltest?mode=TEST"
              className="inline-flex items-center justify-center rounded-[var(--radius-xl)] bg-primary px-8 py-3.5 min-h-[48px] text-[15px] font-semibold text-text-on-primary transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] hover:shadow-[var(--shadow-button-hover)] w-full sm:w-auto"
            >
              Kostenlos trainieren
            </Link>
            <span className="text-[13px] text-text-tertiary">
              Ohne Anmeldung starten
            </span>
          </div>
        </div>

        {/* Features — text only, no icons, no chrome */}
        <div className="mt-20 sm:mt-32 grid grid-cols-3 gap-6 sm:gap-12 max-w-sm sm:max-w-lg w-full">
          <div className="text-center">
            <div className="text-sm sm:text-[15px] font-medium text-text-primary">DFB-Fragen</div>
            <div className="text-xs sm:text-[13px] text-text-tertiary mt-1">Direkt aus der SR-Zeitung</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-[15px] font-medium text-text-primary">Pr&uuml;fungsnah</div>
            <div className="text-xs sm:text-[13px] text-text-tertiary mt-1">Wie im echten Regeltest</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-[15px] font-medium text-text-primary">Sofort verstehen</div>
            <div className="text-xs sm:text-[13px] text-text-tertiary mt-1">Begr&uuml;ndung zu jeder Antwort</div>
          </div>
        </div>
      </main>
    </div>
  );
}
