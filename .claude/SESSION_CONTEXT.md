# Session-Kontext – Schiedsrichter Trainingsapp

> Zuletzt aktualisiert: 2026-02-22
> Zweck: Kontext für neue Claude Code Sessions, damit nicht alles neu analysiert werden muss.

## Projektstatus

### Was fertig ist

**Regeltest MVP (funktionsfähig):**
- Landing Page (Hero mit neuem Copy), Login, Register, Dashboard, Regeltest
- Prüfungsmodus (30 Fragen, 30 Sek/Frage) und Testmodus (15 Fragen, kein Limit)
- KI-Bewertung via Claude Haiku (Batch à 8, Retry, 0/1/2 Punkte-System)
- Zustand Store mit Phasen: idle → loading → active → submitting → evaluating → results
- 13 Regeltest-Komponenten (Client, Active, QuestionCard, Timer, Results, etc.)
- Supabase Auth (Login/Register), Prisma ORM, PostgreSQL
- Dark Mode, Responsive, Accessibility (44px Touch Targets, Focus Rings, Reduced Motion)

**Statistik-Seite (`/dashboard/statistiken`):**
- Fortschritt pro Regelkategorie (Tags) mit Prozent-Balken
- Score-Verteilung (volle/teilweise/keine Punkte) pro Kategorie
- Sortiert nach Schwächen (niedrigste Trefferquote oben)
- Optimiert: Single Raw SQL Query mit `unnest`/`GROUP BY` statt 3 Prisma-Queries
- DB-Indexes: `@@index([userId, isEvaluated])` auf Sessions, `@@index([questionId])` auf Answers
- Verlinkt vom Dashboard ("Statistiken nach Kategorie →")

**Fragen-Daten:**
- `data/questions-all.json` — **146 saubere Fragen** (2025/2026, PDF-Tabellenextraktion via pdfplumber)
  - Quellen: SR-Zeitung 01/2025–02/2026 (je 15), SR-Newsletter 01–06/2025 (je 5–6)
  - Alle Frage-Antwort-Zuordnungen korrekt, keine Ligatur-Fehler, keine Garble-Artefakte
  - **DB-Import ausgeführt** — 146 Fragen in der Datenbank (Stand 2026-02-22)
- `data/convert_excel_to_json.py` — Excel → JSON Konverter mit Validierung und auto-Kriterienextraktion
- `SRZ_Regelfragen_Erfassung.xlsx` — Excel-Template für manuelle Fragenerfassung (Dropdown-Validierung, auto-Nr.)

**Dokumentation:**
- `CLAUDE.md` — Vollständig überarbeitet mit Stack, Design System, Konventionen, Schema, Import-Befehle
- `data/QUALITY_REPORT.md` — Qualitätsbericht der Fragen-Daten

### Was als nächstes ansteht

**Offene Punkte:**
1. Landing Page CTA "Kostenlos trainieren" linkt auf `/regeltest` — braucht ggf. eine Route ohne Auth-Guard (aktuell unter `(protected)/`)
2. "Ohne Anmeldung starten" — Regeltest ohne Account noch nicht implementiert (aktuell redirect auf /login)

### Hero Section

Die Landing Page (`src/app/page.tsx`) wurde überarbeitet:
- **Headline:** "Der Regeltest, der dich zum besseren Schiedsrichter macht."
- **Subline:** "Echte Prüfungsfragen aus der DFB Schiedsrichter-Zeitung — mit sofortigem Feedback nach jeder Antwort."
- **CTA:** Ein Button "Kostenlos trainieren" → `/regeltest` + "Ohne Anmeldung starten" darunter
- **Feature-Badges:** "Offizielle DFB-Fragen", "Prüfungsnah trainieren", "Sofort verstehen"

## Architektur-Entscheidungen

### Warum Freitext statt Multiple Choice?
Die DFB-Prüfung verwendet Freitext-Antworten. Die App bildet das realitätsnah ab. KI-Bewertung ermöglicht Teilpunkte und detailliertes Feedback.

### Warum pdfplumber statt pdftotext?
Frühere Sessions nutzten `pdftotext` für PDF-Extraktion → Spaltenvermischung bei zweispaltigem Layout. `pdfplumber.extract_tables()` erkennt die Tabellenstruktur korrekt und liefert saubere Frage-Antwort-Paare.

### Warum Raw SQL für Statistiken?
Die ursprüngliche Prisma-Query erzeugte 3 separate SQL-Queries (Answers laden, Questions joinen, Sessions filtern) + JavaScript-Aggregation. Ersetzt durch eine einzige SQL-Query mit `unnest(tags)` + `GROUP BY` + `ORDER BY`. Zusammen mit den neuen DB-Indexes deutlich schneller.

### Bewertungslogik
- `criteriaFull`: Alle müssen in der Antwort vorkommen → 2 Punkte
- `criteriaPartial`: Mindestens eins → 1 Punkt
- Beispiel: Frage über Strafstoß-Wiederholung → criteriaFull: ["Strafstoß", "Wiederholung"], criteriaPartial: ["Strafstoß"]
- Tags/Criteria werden automatisch aus dem Antworttext extrahiert (28 Keyword-Patterns)

## Bekannte Probleme

1. **Auth-Guard blockiert Regeltest ohne Login** — `(protected)/layout.tsx` redirected auf `/login`. Für "Ohne Anmeldung starten" muss der Regeltest entweder aus der protected-Gruppe raus oder es braucht eine anonyme Session-Logik.

## Schlüssel-Dateien Quick Reference

| Datei | Zweck |
|-------|-------|
| `src/app/page.tsx` | Landing Page / Hero |
| `src/app/(protected)/dashboard/page.tsx` | Dashboard (Stats, Moduswahl) |
| `src/app/(protected)/dashboard/statistiken/page.tsx` | Statistik pro Regelkategorie |
| `src/app/(protected)/regeltest/page.tsx` | Regeltest-Container |
| `src/app/(protected)/layout.tsx` | Auth Guard |
| `src/stores/regeltestStore.ts` | Zustand Store (Phasen, Answers, Timer) |
| `src/lib/claude/evaluate.ts` | KI-Bewertung (Batch, Retry, Scoring) |
| `src/app/api/regeltest/sessions/` | API Routes (CRUD, Evaluate) |
| `src/app/globals.css` | Design System (60+ CSS Custom Properties) |
| `src/components/regeltest/` | 13 Regeltest-Komponenten |
| `src/components/ui/` | Button, Card, Input, Textarea, Logo |
| `data/questions-all.json` | 146 saubere Fragen (PRODUKTIONSREIF) |
| `data/convert_excel_to_json.py` | Excel → JSON Konverter |
| `prisma/schema.prisma` | DB Schema (7 Modelle, mit Indexes) |
