# CLAUDE.md – Schiedsrichter Trainingsapp

> Diese Datei wird automatisch von Claude Code gelesen.

## Projekt

Lernplattform für Fußball-Schiedsrichter. **Aktueller Fokus: Regeltest MVP.**

Regeltest = Freitext-Fragen aus DFB SR-Zeitung/Newsletter. Nutzer beantwortet Situationen, KI bewertet Antworten nach vordefinierten Kriterien (0/1/2 Punkte).

## Tech Stack

- **Next.js 15** (App Router, Server Components bevorzugt)
- **TypeScript** (strict mode)
- **Tailwind CSS** (DFB-Farben: Grün #006B3F, Gold #C9B037, Dunkel #1A1A2E)
- **Supabase** (Auth, PostgreSQL, EU-Frankfurt)
- **Prisma** (ORM, Schema in `prisma/schema.prisma`)
- **Claude API** (`@anthropic-ai/sdk`, Model: claude-sonnet-4-5-20250929 für Bewertung)
- **Zustand** (Client State)
- **TanStack Query** (Server State)
- **Framer Motion** (Animationen)

## Dateistruktur

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (protected)/     # Dashboard, Regeltest (auth-geschützt)
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Wiederverwendbare UI-Komponenten
│   └── regeltest/       # Regeltest-spezifische Komponenten
├── lib/
│   ├── supabase/        # Supabase Client/Server Setup
│   ├── claude/          # Claude API Integration
│   └── utils.ts         # Hilfsfunktionen (cn, etc.)
├── stores/              # Zustand Stores
└── types/               # TypeScript Interfaces
```

## Konventionen

- **Sprache im Code:** Englisch (Variablen, Kommentare)
- **UI-Texte:** Deutsch
- **Server Components** als Default, `"use client"` nur wenn nötig
- **API Routes** in `app/api/` mit Zod-Validierung
- Keine `console.log` im Production Code
- Fehler-Handling: try/catch mit sinnvollen Fehlermeldungen
- Alle Datenbank-Zugriffe über Prisma (nie raw SQL)

## Regeltest-Logik

- **Prüfungsmodus:** 30 Fragen, 30 Sek/Frage, max 60 Punkte
- **Testmodus:** 15 Fragen, kein Zeitlimit, max 30 Punkte
- **Bewertung:** Erst nach Abgabe aller Fragen, dann KI-Batch-Bewertung
- **Punktesystem:** 2P = alle Kriterien erfüllt, 1P = Teilkriterien, 0P = falsch/leer

## Wichtige Befehle

```bash
npm run dev          # Entwicklungsserver
npx prisma generate  # Prisma Client generieren
npx prisma db push   # Schema zur DB pushen
npx prisma studio    # DB-GUI
npm run build        # Production Build
```
