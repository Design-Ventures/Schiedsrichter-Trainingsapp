# Schiri.App – Analyse der KI-gestützten Prüfungsbewertung

## Zusammenfassung

**Testergebnis:** 13/48 Punkte — Nicht bestanden
**Korrekt:** 4 Fragen (2P) | **Teilweise:** 5 Fragen (1P) | **Falsch/Leer:** 21 Fragen (0P)

Die Analyse zeigt **5 kritische Fehlerklassen** im Bewertungsverhalten von Claude Haiku, die durch ein strukturiertes Metadaten-Schema pro Frage systematisch behoben werden können.

---

## Teil 1: Fehlerklassifikation

### Fehlerklasse 1 — Halluzinierte Bewertungen bei leeren Antworten (Kritisch)

**Betroffene Fragen:** 4, 6, 10, 12, 14, 21

Bei Fragen ohne abgegebene Antwort generiert Haiku fiktive Bewertungen wie *"Die Antwort nennt X statt Y"* — obwohl keine Antwort existiert. Das Modell erfindet eine Antwort und bewertet diese.

**Ursache:** Der Prompt enthält keine explizite Anweisung, leere Antworten als Sonderfall zu behandeln. Haiku versucht, das Bewertungsschema auch auf Nicht-Antworten anzuwenden.

**Lösung:**
- Vorverarbeitung: Leere Antworten vor dem LLM-Aufruf abfangen → automatisch 0 Punkte, Feedback: "Keine Antwort abgegeben"
- Falls doch an Haiku übergeben: Expliziter Prompt-Abschnitt: *"Wenn die Antwort leer ist oder nur Leerzeichen enthält, vergib 0 Punkte und schreibe: 'Keine Antwort abgegeben.'"*

---

### Fehlerklasse 2 — Cross-Contamination zwischen Fragen (Kritisch)

**Betroffenes Beispiel:** Frage 3

Haiku überträgt Bewertungslogik oder Inhalte einer Frage auf eine andere. Bei Frage 3 wurde die Bewertung von Frage 2 (Torwart-Ball-Halten) fälschlicherweise auf Frage 3 angewendet.

**Ursache:** Wenn mehrere Fragen in einem einzigen API-Call gesendet werden, vermischt Haiku den Kontext. Alternativ: Zu wenig Trennung zwischen Frage-Antwort-Paaren im Prompt.

**Lösung:**
- Jede Frage einzeln bewerten (eigener API-Call) — oder klare Trennmarker verwenden
- Strukturiertes JSON-Format für Ein-/Ausgabe mit eindeutiger Frage-ID
- Prompt-Anweisung: *"Bewerte ausschließlich die Antwort zu Frage {id}. Ignoriere alle anderen Fragen."*

---

### Fehlerklasse 3 — Fehlende Teilpunkt-Vergabe (Schwerwiegend)

**Betroffenes Beispiel:** Frage 22

Antwort enthielt "Rote Karte + direkter Freistoß" — Rote Karte war korrekt, aber Spielfortsetzung falsch (richtig: Strafstoß). Haiku vergab 0 statt 1 Punkt.

**Ursache:** Das Bewertungsschema differenziert nicht klar zwischen unabhängigen Bewertungsdimensionen. Haiku behandelt die Antwort als Ganzes statt als Summe von Teilen.

**Lösung:** Strukturierte Pflicht-Elemente pro Frage (siehe Metadaten-Schema), wobei jedes Element einzeln bewertet wird und Teilpunkte möglich sind.

---

### Fehlerklasse 4 — Synonyme werden nicht erkannt (Schwerwiegend)

**Betroffenes Beispiel:** Frage 28

Antwort "Beide Trainer Rote Karte, Schiedsrichterball" war inhaltlich identisch mit der Musterantwort "Rote Karte für beide, Schiedsrichter-Ball", erhielt aber 0 Punkte.

**Ursache:** Haiku vergleicht zu stark wörtlich statt semantisch. Ohne eine explizite Synonymliste fehlt dem Modell die Toleranz für gleichbedeutende Formulierungen.

**Lösung:**
- Synonym-Listen pro Fachbegriff in den Metadaten
- Prompt-Anweisung: *"Bewerte die inhaltliche Korrektheit, nicht die exakte Formulierung. Folgende Begriffe sind synonym: {Synonymliste}"*

---

### Fehlerklasse 5 — Keine Gewichtung nach Schweregrad (Verbesserung)

Kardinalfehler (z.B. falsche Spielfortsetzung) und Nebenfehler (z.B. ungenaue Ortsangabe) werden gleich behandelt. Ein differenziertes Bewertungssystem würde die Qualität des Feedbacks und der Statistiken erheblich verbessern.

---

## Teil 2: Empfohlenes Metadaten-Schema pro Frage

Jede Prüfungsfrage sollte folgende strukturierte Metadaten enthalten:

```json
{
  "frage_id": "Q-2026-003",
  "frage_text": "Torwart hält Ball im eigenen Strafraum länger als 6 Sekunden. Was entscheidest du?",
  "kategorie": "Spielfortsetzung",
  "schwierigkeitsgrad": 3,
  "max_punkte": 2,

  "bewertungskriterien": {
    "pflicht_elemente": [
      {
        "id": "PE1",
        "beschreibung": "Korrekte Spielfortsetzung",
        "erwarteter_wert": "Indirekter Freistoß",
        "gewicht": 1.0,
        "synonyme": [
          "indirekter Freistoß",
          "ind. Freistoß",
          "IFK"
        ]
      },
      {
        "id": "PE2",
        "beschreibung": "Korrekter Ausführungsort",
        "erwarteter_wert": "Wo der Torwart den Ball berührt hat",
        "gewicht": 0.5,
        "synonyme": [
          "Tatort",
          "Stelle des Vergehens",
          "wo der TW den Ball hielt"
        ]
      },
      {
        "id": "PE3",
        "beschreibung": "Persönliche Strafe",
        "erwarteter_wert": "Keine",
        "gewicht": 0.5,
        "synonyme": []
      }
    ],
    "optional_elemente": [
      {
        "id": "OE1",
        "beschreibung": "Hinweis auf Regel 12",
        "bonus_punkte": 0
      }
    ]
  },

  "spielfortsetzung": {
    "typ": "indirekter_freistoss",
    "ort": "Tatort im Strafraum",
    "fuer": "angreifende Mannschaft"
  },

  "persoenliche_strafe": {
    "typ": "keine",
    "fuer": null,
    "personen_kategorie": null
  },

  "sonderregel_tags": ["6-Sekunden-Regel", "Torwart-Vergehen"],

  "typische_fehlannahmen": [
    "Direkter Freistoß statt indirekter",
    "Gelbe Karte für Torwart",
    "Strafstoß"
  ],

  "teilpunkt_logik": {
    "2_punkte": "Alle Pflichtelemente korrekt",
    "1_punkt": "Mindestens ein Pflichtelement korrekt (z.B. Spielfortsetzungstyp ODER persönliche Strafe)",
    "0_punkte": "Kein Pflichtelement korrekt ODER keine Antwort"
  },

  "bewertungs_hinweis": "Bei leerer Antwort: Sofort 0 Punkte, keine weitere Analyse."
}
```

---

## Teil 3: Bewertungs-Prompt-Architektur

### Empfohlener System-Prompt für Haiku als Prüfer

```
Du bist ein Schiedsrichter-Prüfer für Fußball-Regelkunde.

REGELN FÜR DIE BEWERTUNG:

1. LEERE ANTWORTEN: Wenn die Antwort leer ist, nur Leerzeichen enthält
   oder "keine Antwort" lautet → 0 Punkte. Schreibe: "Keine Antwort
   abgegeben." Erfinde NIEMALS eine Antwort.

2. ISOLIERTE BEWERTUNG: Bewerte NUR die Antwort zur aktuellen Frage.
   Beziehe dich nicht auf andere Fragen oder Antworten.

3. SEMANTISCHER VERGLEICH: Vergleiche inhaltlich, nicht wörtlich.
   Nutze die bereitgestellten Synonymlisten.

4. TEILPUNKTE: Bewerte jedes Pflichtelement einzeln.
   - Alle Pflichtelemente korrekt → volle Punktzahl
   - Mindestens eines korrekt → Teilpunkte gemäß Teilpunkt-Logik
   - Keines korrekt → 0 Punkte

5. AUSGABEFORMAT (JSON):
   {
     "frage_id": "...",
     "punkte": 0-2,
     "max_punkte": 2,
     "bewertung_pro_element": [
       {"element_id": "PE1", "korrekt": true/false, "kommentar": "..."}
     ],
     "gesamt_feedback": "...",
     "erkannte_fehlannahme": "..." oder null
   }
```

### Beispiel API-Call-Struktur

```json
{
  "model": "claude-3-5-haiku-20241022",
  "messages": [
    {
      "role": "user",
      "content": {
        "frage": {
          "id": "Q-2026-003",
          "text": "Torwart hält Ball im eigenen Strafraum länger als 6 Sekunden...",
          "metadaten": { /* vollständiges Schema von oben */ }
        },
        "antwort": "Indirekter Freistoß wo der Torwart stand"
      }
    }
  ]
}
```

---

## Teil 4: Lernschleife und Statistik-Generierung

### Daten, die pro Bewertung gesammelt werden sollten

| Datenpunkt | Zweck |
|---|---|
| Frage-ID + Antwort + Bewertung | Grundlage für alle Analysen |
| Erkannte Fehlannahme | Fütterung der "typische_fehlannahmen"-Liste |
| Bewertungsdauer (ms) | Performance-Monitoring |
| Element-Level-Bewertung | Granulare Analyse: Welche Aspekte sind schwierig? |
| Schwierigkeitsgrad vs. Ergebnis | Kalibrierung der Schwierigkeitsskala |

### Statistiken für Lernbegleitung

Aus den gesammelten Daten lassen sich automatisch ableiten:

**Pro Prüfling:**
- Schwächste Kategorien (z.B. "Spielfortsetzungen bei Torwart-Vergehen")
- Häufigste Fehlannahmen
- Fortschritt über mehrere Prüfungen
- Personalisierte Lernempfehlungen

**Pro Frage:**
- Durchschnittliche Punktzahl (Schwierigkeits-Kalibrierung)
- Häufigste falsche Antworten (erweitert "typische_fehlannahmen")
- Bewertungskonsistenz (wenn gleiche Antwort unterschiedlich bewertet wird → Prompt-Optimierung nötig)

**Pro Modell-Version:**
- Halluzinationsrate bei leeren Antworten
- Synonym-Erkennungsrate
- Teilpunkt-Genauigkeit
- Cross-Contamination-Rate

### Feedback-Loop zur Modellverbesserung

```
Prüfung → Bewertung durch Haiku → Ergebnisse gespeichert
    ↓
Manuelle Stichproben-Überprüfung (z.B. 10% der Bewertungen)
    ↓
Diskrepanzen identifiziert → Prompt-Anpassung ODER Metadaten-Erweiterung
    ↓
A/B-Test mit neuem Prompt gegen alten
    ↓
Bessere Version wird produktiv
```

---

## Teil 5: Sofort umsetzbare Quick Wins

1. **Leere-Antworten-Guard** — Vor dem API-Call prüfen, ob Antwort leer ist. Wenn ja: 0 Punkte vergeben, kein LLM-Aufruf nötig. *Behebt Fehlerklasse 1 sofort und spart API-Kosten.*

2. **Einzelbewertung pro Frage** — Jede Frage in einem eigenen API-Call bewerten statt alle auf einmal. *Behebt Fehlerklasse 2 (Cross-Contamination).*

3. **Synonym-Listen einführen** — Pro Fachbegriff 3-5 akzeptierte Formulierungen definieren. *Behebt Fehlerklasse 4.*

4. **Strukturiertes JSON-Output erzwingen** — Haiku zur Ausgabe im definierten JSON-Format anweisen. *Macht Bewertungen parsbar und analysierbar.*

5. **Teilpunkt-Logik explizit im Prompt** — Pro Frage definieren, wann 2/1/0 Punkte vergeben werden. *Behebt Fehlerklasse 3.*
