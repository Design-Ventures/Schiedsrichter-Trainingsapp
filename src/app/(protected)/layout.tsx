import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { LogoutButton } from "@/components/ui/logout-button";
import { PageTransition } from "@/components/ui/page-transition";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-6 sm:py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
