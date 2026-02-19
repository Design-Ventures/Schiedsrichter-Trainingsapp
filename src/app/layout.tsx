import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schiedsrichter Trainingsapp",
  description:
    "Lernplattform für Fußball-Schiedsrichter – Regeltest mit KI-Bewertung",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Schiedsrichter Trainingsapp",
    description: "Lernplattform für Fußball-Schiedsrichter",
    locale: "de_DE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
