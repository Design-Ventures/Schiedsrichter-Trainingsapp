import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[--radius-2xl] bg-primary shadow-lg">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Schiedsrichter
            <span className="block text-gradient">Trainingsapp</span>
          </h1>
          <p className="mt-3 text-text-on-dark-secondary">
            Teste dein Regelwissen mit KI-Bewertung
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-[--radius-lg] bg-primary px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
        >
          Anmelden
        </Link>

        <p className="mt-4 text-sm text-text-on-dark-secondary">
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
