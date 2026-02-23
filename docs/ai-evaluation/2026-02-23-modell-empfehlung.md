# Modell-Empfehlung: Haiku vs. Sonnet für Prüfungsbewertung

## Empfehlung: Haiku 3.5 reicht — mit den richtigen Metadaten

Haiku ist für diese Aufgabe geeignet, **sofern die strukturierten Metadaten mitgeliefert werden**. Das Durchspiel hat gezeigt: Mit Bewertungselementen, Synonymen und expliziter Teilpunkt-Logik hat Haiku alle 6 Testfragen korrekt bewertet — inklusive leere Antworten, Synonyme und Teilpunkte.

## Wann Haiku ausreicht (ca. 85% der Fragen)

Haiku funktioniert zuverlässig bei:

- Klaren Ja/Nein-Fragen (25 Fragen)
- Standard-Spielfortsetzungen mit 1–2 Bewertungselementen
- Fragen, bei denen die Metadaten die Bewertung vollständig vorstrukturieren
- Fragen mit guten Synonym-Listen und falschen Alternativen

## Wann Haiku riskant ist (ca. 15% der Fragen)

Haiku könnte Schwierigkeiten haben bei:

- **Komplexen Ausnahmeregeln** (z.B. Frage 7: Rote Karte wird zurückgenommen, weil das Tor wegen vorherigem Handspiel nicht gezählt hätte)
- **Mehrstufigen Entscheidungsketten** (z.B. Frage 24: Strafstoß → Ball abgewehrt → Abseits beim Nachschuss)
- **Fragen mit langen, nuancierten Erklärungen** als Musterantwort
- **Situationen, in denen der Prüfling teilweise richtig antwortet, aber mit falscher Begründung**

## Empfohlene Strategie: Hybrid-Ansatz

```
Frage eintrifft
    │
    ▼
┌─────────────────────────────┐
│ Schwierigkeitsgrad prüfen   │
│ (aus Metadaten)             │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
Stufe 1-3     Stufe 4-5
     │           │
     ▼           ▼
  HAIKU       SONNET
  (schnell,    (langsamer,
   günstig)    zuverlässiger)
```

### Kosten/Geschwindigkeit Vergleich

| Modell | Latenz (geschätzt) | Kosten pro Bewertung | Genauigkeit (geschätzt) |
|--------|-------------------|---------------------|------------------------|
| Haiku 3.5 | ~0.5–1s | ~$0.001 | 90–95% mit Metadaten |
| Sonnet 4.5 | ~1.5–3s | ~$0.008 | 97–99% mit Metadaten |

Für eine typische Prüfung mit 30 Fragen:

- **Nur Haiku:** ~15–30s Gesamtlatenz, ~$0.03 Kosten
- **Hybrid (25 Haiku + 5 Sonnet):** ~20–40s, ~$0.065 Kosten
- **Nur Sonnet:** ~45–90s, ~$0.24 Kosten

### Implementierung

```javascript
async function bewerteFrage(frage, antwort) {
  const model = frage.schwierigkeitsgrad >= 4
    ? "claude-sonnet-4-5-20250929"
    : "claude-haiku-4-5-20251001";

  return await callClaude({
    model: model,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: JSON.stringify({ frage, antwort })
    }]
  });
}
```

## Zusätzliche Option: Zweistufige Validierung

Für maximale Genauigkeit bei wichtigen Prüfungen:

1. **Haiku bewertet** (schnell, günstig)
2. **Bei 0 oder 1 Punkt:** Sonnet prüft die Haiku-Bewertung nach
3. **Bei Diskrepanz:** Sonnet-Bewertung gewinnt

So werden nur strittige Bewertungen doppelt geprüft. Kosten bleiben niedrig, Genauigkeit steigt deutlich.

## Fazit

Haiku bleibt die richtige Wahl für den Großteil der Fragen. Die Verbesserung kommt primär aus den **Metadaten**, nicht aus dem Modell. Haiku mit guten Metadaten schlägt Sonnet ohne Metadaten. Für die ~15% komplexen Fragen (Schwierigkeitsgrad 4–5) lohnt sich der Hybrid-Ansatz mit Sonnet als Fallback.
