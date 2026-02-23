# AI Evaluation System – Dokumentation

> Dieses Verzeichnis enthält Analysen, Learnings und Iterationen zur KI-gestützten Prüfungsbewertung.

## Verzeichnisstruktur

```
docs/ai-evaluation/
├── README.md                           # Diese Datei
├── 2026-02-23-haiku-fehleranalyse.md   # Initiale Fehleranalyse des Haiku-Bewertungssystems
├── 2026-02-23-training-konzept.md      # Trainingskonzept (3 Hebel, 3 Phasen)
└── 2026-02-23-modell-empfehlung.md     # Haiku vs. Sonnet Analyse
```

## Zusammenhang mit dem Code

| Dokument | Implementiert in |
|----------|-----------------|
| Fehleranalyse | Behoben via `src/lib/claude/prompts/system-evaluation.ts` |
| Training-Konzept | Umgesetzt via `data/evaluation/questions-enriched.json` |
| Modell-Empfehlung | Vorbereitet via `selectModel()` in `src/lib/claude/evaluate.ts` |

## Konvention für neue Einträge

Neue Analysen und Learnings folgen dem Schema:
```
YYYY-MM-DD-kurzbeschreibung.md
```

Inhalte die hier hingehören:

- Fehleranalysen nach Testdurchläufen
- Statistische Auswertungen der Bewertungsqualität
- Änderungen am System-Prompt mit Begründung
- Learnings aus manuellen Stichproben
- A/B-Test-Ergebnisse bei Prompt-Änderungen

Inhalte die NICHT hier hingehören (sondern im Code):

- System-Prompts → `src/lib/claude/prompts/`
- Fragen-Metadaten → `data/evaluation/`
- TypeScript-Typen → `src/types/`
