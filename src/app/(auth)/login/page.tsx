"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "E-Mail oder Passwort ist falsch."
            : authError.message
        );
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-surface p-6 sm:p-8 shadow-[var(--shadow-card-soft)]">
          <div className="mb-6 sm:mb-8 text-center">
            <Link href="/">
              <Logo />
            </Link>
            <h1 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-bold text-text-primary">
              Willkommen zur&uuml;ck
            </h1>
            <p className="mt-1 text-[13px] sm:text-sm text-text-secondary">
              um weiterzulernen
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              id="email"
              label="E-Mail"
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Passwort"
              type="password"
              placeholder="Dein Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? (
              <p className="text-sm text-error">{error}</p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
        </div>

        <p className="mt-5 sm:mt-6 text-center text-[13px] sm:text-sm text-text-secondary">
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="font-medium text-text-primary hover:underline"
          >
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
