"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
      router.refresh();
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Anmelden</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Melde dich an, um fortzufahren
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Anmelden
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Jetzt registrieren
          </Link>
        </p>
      </Card>
    </div>
  );
}
