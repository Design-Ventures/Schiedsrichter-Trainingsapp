"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 sm:mb-8 text-center">
          <Link href="/">
            <Logo />
          </Link>
          <h1 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-bold text-text-primary">Registrieren</h1>
          <p className="mt-1 text-[13px] sm:text-sm text-text-secondary">
            Erstelle ein neues Konto
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <Input
            id="name"
            label="Name"
            type="text"
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            placeholder="Mindestens 6 Zeichen"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error ? (
            <p className="text-sm text-error">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Konto erstellen
          </Button>
        </form>

        <p className="mt-5 sm:mt-6 text-center text-[13px] sm:text-sm text-text-secondary">
          Bereits ein Konto?{" "}
          <Link
            href="/login"
            className="font-medium text-text-primary hover:underline"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
