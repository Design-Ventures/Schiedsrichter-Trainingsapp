# CLAUDE.md – Schiedsrichter Trainingsapp

> Diese Datei wird automatisch von Claude Code gelesen.

## Projekt

**Repo-Pfad:** `/Users/enricoschnell/Developer/Repos/Monorepo/schiedsrichter-trainingsapp`

Lernplattform für Fußball-Schiedsrichter unter **schiri.app**. Aktueller Fokus: **Regeltest MVP**.

Regeltest = Freitext-Fragen aus DFB SR-Zeitung/Newsletter (2025/2026). Nutzer beantwortet Spielsituationen in Freitext, KI (Claude) bewertet Antworten nach vordefinierten Kriterien (0/1/2 Punkte).

**Positionierung:** "Der Regeltest, der dich zum besseren Schiedsrichter macht." – Die App hilft Schiris, sich auf die Regelprüfung vorzubereiten und besser zu werden. Einstieg ohne Account, Account optional für Prüfungsergebnisse.

## Tech Stack

| Bereich | Technologie | Details |
|---------|------------|---------|
| Framework | **Next.js 15** | App Router, Server Components bevorzugt |
| Sprache | **TypeScript** | strict mode |
| Styling | **Tailwind CSS v4** | `@theme` in globals.css, CSS Custom Properties |
| Auth | **Supabase** | Auth + PostgreSQL, EU-Frankfurt |
| ORM | **Prisma** | Schema in `prisma/schema.prisma` |
| KI-Bewertung | **Claude API** | `@anthropic-ai/sdk`, Model: `claude-haiku-4-5-20251001` |
| Client State | **Zustand** | `src/stores/regeltestStore.ts` |
| Server State | **TanStack Query** | Provider in `src/app/providers.tsx` |
| Animationen | **Framer Motion** | Übergänge und Ladeanimationen |
| Validation | **Zod** | API Route Input-Validierung |

## Design System

Luma-inspiriert. Alle Farben, Shadows, Radii und Transitions als CSS Custom Properties in `src/app/globals.css`.

### Farben (Light Mode → Dark Mode invertiert automatisch)

- **Primary:** `#18181B` (Text, Buttons) → Dark: `#FAFAFA`
- **Accent:** `#8B5CF6` (Lila, interaktive Elemente) → Dark: `#A78BFA`
- **Exam:** `#EF4444` (Rot, Prüfungsmodus)
- **Test:** `#8B5CF6` (Lila, Testmodus)
- **Neutrals:** Zinc-Skala (gray-50 `#FAFAFA` bis gray-950 `#09090B`)
- **Feedback:** Success `#16A34A`, Error `#DC2626`, Warning `#F59E0B`, Info `#3B82F6`
- **AI-Feedback:** Blautöne (`--color-feedback-*`)

### Typografie

- **Font:** Inter (Google Fonts, `--font-inter`)
- **Headings:** `letter-spacing: -0.035em` (h1), `-0.025em` (h2-h4), `font-weight: 700/600`
- **Body:** antialiased, font-feature-settings `cv02`, `cv03`, `cv04`, `cv11`

### Komponenten-Patterns

- **Border Radius:** `var(--radius-lg)` (8px) für Buttons/Cards, `var(--radius-full)` für Pills
- **Min Touch Target:** `min-h-[44px]` auf allen interaktiven Elementen
- **Shadows:** `var(--shadow-card)` → `var(--shadow-card-hover)` bei Hover
- **Transitions:** `var(--transition-fast)` 150ms, `var(--transition-base)` 200ms
- **Focus:** `border-focus` (dark) Ring auf fokussierten Elementen
- **Glassmorphism:** `.glass` Utility für Overlays
- **Skeleton:** `.skeleton` mit Shimmer-Animation
- **Gradient Bar:** `.gradient-bar` (2px, Lila-Gradient) oben auf jeder Seite
- **Dark Mode:** Vollständig via `prefers-color-scheme: dark` in globals.css
- **Reduced Motion:** Respektiert `prefers-reduced-motion: reduce`

### UI-Komponenten (`src/components/ui/`)

| Komponente | Varianten | Hinweise |
|-----------|-----------|----------|
| `Button` | primary, secondary, outline, ghost × sm, md, lg | `isLoading` zeigt Spinner |
| `Card` | Card, CardHeader, CardTitle, CardContent | Kompositions-Pattern mit forwardRef |
| `Input` | – | label, error Props, focus ring |
| `Textarea` | – | Wie Input, resize-none |
| `Logo` | – | "schiri" Text, gray-500 |

## Dateistruktur

```
src/
├── app/
│   ├── globals.css             # Theme (CSS Custom Properties)
│   ├── layout.tsx              # Root Layout (Inter, Providers, gradient-bar)
│   ├── page.tsx                # Landing Page (Hero)
│   ├── providers.tsx           # QueryClientProvider
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Auth Guard (redirects → /login)
│   │   ├── dashboard/page.tsx  # Stats, Moduswahl, History
│   │   └── regeltest/page.tsx  # Regeltest-Container
│   └── api/regeltest/sessions/
│       ├── route.ts            # POST: Session erstellen
│       └── [id]/
│           ├── route.ts        # GET/PATCH: Session Details
│           ├── answers/route.ts    # POST: Antworten abgeben
│           └── evaluate/route.ts   # POST: KI-Bewertung triggern
├── components/
│   ├── ui/                     # Button, Card, Input, Textarea, Logo
│   └── regeltest/              # 13 Komponenten (siehe unten)
├── lib/
│   ├── prisma.ts               # Singleton PrismaClient
│   ├── auth.ts                 # getAuthenticatedUser()
│   ├── utils.ts                # cn() (clsx + tailwind-merge)
│   ├── supabase/server.ts      # Server-Side Supabase Client
│   ├── supabase/client.ts      # Browser Supabase Client
│   ├── claude/client.ts        # Singleton Anthropic Client
│   └── claude/evaluate.ts      # evaluateAnswers() – Batch (8er), Retry, JSON
├── stores/
│   └── regeltestStore.ts       # Zustand: phase, mode, questions, answers, timer
└── types/
    └── regeltest.ts            # Interfaces + REGELTEST_CONFIG
```

### Regeltest-Komponenten (`src/components/regeltest/`)

```
RegeltestClient.tsx      # Orchestrator: phase-basierte Ansichtswechsel
RegeltestLoading.tsx     # Skeleton Ladeansicht
RegeltestActive.tsx      # Haupt-Testinterface
QuestionCard.tsx         # Situationstext-Anzeige
AnswerInput.tsx          # Freitext-Eingabefeld
Timer.tsx                # 30-Sek-Countdown (nur EXAM)
ProgressBar.tsx          # Fortschrittsbalken
QuestionNavigation.tsx   # Fragen-Navigation (EXAM: sequentiell, TEST: frei)
SubmitConfirmation.tsx   # Abgabe-Bestätigung
EvaluatingView.tsx       # KI-Bewertung läuft…
ResultsView.tsx          # Endergebnis + Einzelergebnisse
QuestionResult.tsx       # Einzelfrage-Ergebnis mit Feedback
RegeltestError.tsx       # Fehler + Retry
```

## Konventionen

- **Sprache im Code:** Englisch (Variablen, Kommentare, Typen)
- **UI-Texte:** Deutsch
- **Server Components** als Default, `"use client"` nur wenn nötig (State, Event-Handler, Browser APIs)
- **API Routes:** `app/api/` mit Zod-Validierung, Auth über `getAuthenticatedUser()`
- **Styling:** Tailwind Utilities + CSS Custom Properties aus `globals.css` (nie inline `style={}`)
- **Klassen-Merging:** `cn()` aus `src/lib/utils.ts` (clsx + tailwind-merge)
- **Fehler-Handling:** try/catch mit sinnvollen Fehlermeldungen, kein `console.log` in Production
- **DB-Zugriffe:** Ausschließlich über Prisma (nie raw SQL, außer in Import-Scripts)
- **Imports:** Pfad-Alias `@/*` → `./src/*`
- **Touch Targets:** Mindestens `min-h-[44px]` auf interaktiven Elementen
- **Accessibility:** Focus Rings, Reduced Motion Support, semantisches HTML

## Regeltest-Logik

### Modi

| Modus | Fragen | Zeit/Frage | Max. Punkte |
|-------|--------|-----------|-------------|
| **EXAM** (Prüfungsmodus) | 30 | 30 Sek | 60 |
| **TEST** (Testmodus) | 15 | unbegrenzt | 30 |

### Ablauf

1. **Session erstellen** → POST `/api/regeltest/sessions` (Fisher-Yates Shuffle, N Fragen auswählen)
2. **Fragen beantworten** → Client-seitig im Zustand Store
3. **Abgabe** → POST `/api/regeltest/sessions/[id]/answers`
4. **KI-Bewertung** → POST `/api/regeltest/sessions/[id]/evaluate` (Batch à 8 Fragen, Claude Haiku)
5. **Ergebnis anzeigen** → Score, Einzelfeedback, matchedCriteria

### Bewertungssystem

- **2 Punkte:** Alle `criteriaFull` Schlüsselwörter in der Antwort
- **1 Punkt:** Mindestens ein `criteriaPartial` Schlüsselwort
- **0 Punkte:** Nichts getroffen oder leere Antwort

### Phasen (Zustand Store)

`idle → loading → active → submitting → evaluating → results | error`

## Datenbank-Schema (Prisma)

### Kern-Modelle

```prisma
RegeltestQuestion {
  id              String   @id @default(uuid())
  situation       String   @db.Text        // Spielsituation/Frage
  correctAnswer   String   @db.Text        // Musterlösung
  explanation     String?  @db.Text        // Erklärung
  criteriaFull    String[]                 // Alle müssen matchen → 2P
  criteriaPartial String[]                 // Mind. eins → 1P
  ruleReference   String?                  // z.B. "Regel 12, Regel 14"
  source          String                   // "SR-Zeitung 03/2025"
  sourceDate      DateTime?
  tags            String[]                 // ["Abseits", "Strafstoß", ...]
  isActive        Boolean  @default(true)
}

RegeltestSession {
  id, userId, mode (EXAM|TEST)
  totalQuestions, totalScore, maxScore
  timeSpentSecs, startedAt, completedAt
  isCompleted, isEvaluated
}

RegeltestAnswer {
  id, sessionId, questionId, questionIndex
  userAnswer, score (0|1|2), aiFeedback
  matchedCriteria[], timeSpentSecs
  @@unique([sessionId, questionIndex])
}
```

## Fragen-Daten

Quelldaten in `data/`:

| Datei | Inhalt |
|-------|--------|
| `questions-2025-2026.json` | **146 Fragen** – Aktuelle, saubere Extraktion aus PDF (Tabellenextraktion) |
| `questions-all.json` | 344 Fragen (ältere, teilw. fehlerbehaftete Text-Extraktion 2013–2024) |
| `questions-preview.json` | 145 Fragen (ältere Text-Extraktion 2025/2026, mit Zuordnungsfehlern) |
| `convert_excel_to_json.py` | Excel → JSON Konverter für manuelle Erfassung |

### JSON-Format pro Frage

```json
{
  "index": 1,
  "situation": "Spielsituation / Fragetext",
  "correctAnswer": "Musterlösung inkl. Begründung",
  "source": "SR-Zeitung 03/2025",
  "criteriaFull": ["Strafstoß", "Wiederholung"],
  "criteriaPartial": ["Strafstoß"],
  "sourceDate": "2025-03-01",
  "ruleReference": "Regel 14",
  "tags": ["Spielfortsetzung", "Strafstoß"],
  "explanation": "Begründung mit Regelverweis"
}
```

### Import-Befehle

```bash
# Trockenlauf (zeigt nur Zusammenfassung):
npm run import:all

# Neue Fragen hinzufügen (Duplikate überspringen):
npm run import:all -- --import

# Bestehende updaten + neue importieren:
npm run import:all -- --import --update

# Alles löschen und neu importieren:
npm run import:all -- --replace
```

Das Import-Script liest aus `data/questions-all.json`. Um nur die 146 sauberen 2025/2026-Fragen zu verwenden:
```bash
cp data/questions-2025-2026.json data/questions-all.json
npm run import:all -- --replace
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL="postgresql://...?pgbouncer=true"    # Pooled (für Prisma)
DIRECT_URL="postgresql://...port=5432/postgres"   # Direct (für Migrations)

# Claude API (KI-Bewertung)
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Wichtige Befehle

```bash
npm run dev              # Entwicklungsserver (localhost:3000)
npm run build            # Production Build
npm run lint             # Linting
npx prisma generate      # Prisma Client generieren
npx prisma db push       # Schema zur DB pushen
npx prisma studio        # DB-GUI im Browser
npm run import:all       # Fragen-Import (siehe oben)
```
