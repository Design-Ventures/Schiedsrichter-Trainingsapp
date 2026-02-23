# Schiri.App – Trainingskonzept für KI-gestützte Prüfungsbewertung

## Das Kernproblem

Claude Haiku (oder jedes andere LLM) ist ein Sprachmodell — es "kennt" die Fußballregeln nur oberflächlich aus dem Training. Für eine zuverlässige Prüfungsbewertung reicht das nicht. Das Modell muss **zur Bewertungszeit** alle nötigen Informationen strukturiert erhalten, um korrekt beurteilen zu können.

Es gibt drei Hebel, die zusammenwirken:

```
┌─────────────────────────────────────────────────────┐
│  1. WISSENSBASIS      Was das Modell wissen muss    │
│     (Metadaten pro Frage)                           │
├─────────────────────────────────────────────────────┤
│  2. BEWERTUNGSLOGIK   Wie das Modell urteilen soll  │
│     (System-Prompt + Bewertungsregeln)              │
├─────────────────────────────────────────────────────┤
│  3. LERNSCHLEIFE      Wie das System besser wird    │
│     (Feedback-Daten + Statistiken)                  │
└─────────────────────────────────────────────────────┘
```

---

## Hebel 1: Die Wissensbasis – Strukturierte Metadaten pro Frage

### Warum reicht eine Musterantwort nicht?

Eine Musterantwort wie *"Indirekter Freistoß an der Stelle des Vergehens, keine persönliche Strafe"* sagt dem Modell nur **was** richtig ist — aber nicht:

- Welche Teile der Antwort wie wichtig sind
- Welche Formulierungen gleichbedeutend sind
- Was typische Fehler sind und wie sie zu bewerten sind
- Wann Teilpunkte angemessen sind

### Das vollständige Metadaten-Schema

Jede Frage braucht diese Ebenen:

#### Ebene 1: Grunddaten

```json
{
  "frage_id": "SR-2026-003",
  "regelbereich": "Regel 12 – Fouls und unsportliches Betragen",
  "unterkategorie": "Torwart-Vergehen",
  "schwierigkeitsgrad": 3,
  "tags": ["6-Sekunden-Regel", "indirekter-freistoss", "strafraum"],
  "frage_text": "Der Torwart der Heimmannschaft hält den Ball im eigenen Strafraum länger als 6 Sekunden fest. Was entscheidest du?",
  "musterantwort": "Indirekter Freistoß für die Gastmannschaft an der Stelle, wo der Torwart den Ball gehalten hat. Keine persönliche Strafe."
}
```

#### Ebene 2: Zerlegte Bewertungskriterien

Hier liegt der entscheidende Unterschied. Die Musterantwort wird in **unabhängig bewertbare Elemente** zerlegt:

```json
{
  "bewertungselemente": [
    {
      "id": "E1",
      "name": "Spielfortsetzungstyp",
      "korrekte_werte": ["indirekter Freistoß"],
      "gewicht": "pflicht",
      "punkte_anteil": 1.0,
      "synonyme": ["indirekter Freistoß", "IFK", "ind. Freistoß", "indirekter FK"],
      "falsche_alternativen": {
        "direkter Freistoß": "Häufiger Fehler: Torwart-Vergehen nach Regel 12.2 werden immer mit indirektem Freistoß geahndet, nie mit direktem.",
        "Strafstoß": "Strafstoß nur bei direktem Freistoß-Vergehen im eigenen Strafraum. Die 6-Sekunden-Regel ist ein indirektes Vergehen.",
        "Eckstoß": "Eckstoß ist eine Spielfortsetzung, wenn der Ball über die Torlinie geht – hier nicht relevant."
      }
    },
    {
      "id": "E2",
      "name": "Ausführungsort",
      "korrekte_werte": ["Stelle des Vergehens", "wo der Torwart den Ball gehalten hat"],
      "gewicht": "pflicht",
      "punkte_anteil": 0.5,
      "synonyme": ["Tatort", "wo der TW stand", "Ort des Vergehens", "Ballposition"],
      "falsche_alternativen": {
        "Strafraumgrenze": "Der Freistoß wird nicht an der Strafraumgrenze ausgeführt, sondern am Ort des Vergehens innerhalb des Strafraums.",
        "Elfmeterpunkt": "Nur bei Strafstoß relevant."
      }
    },
    {
      "id": "E3",
      "name": "Persönliche Strafe",
      "korrekte_werte": ["keine", "keine persönliche Strafe"],
      "gewicht": "pflicht",
      "punkte_anteil": 0.5,
      "synonyme": ["ohne Karte", "keine Verwarnung", "kein Feldverweis"],
      "falsche_alternativen": {
        "Gelbe Karte": "Die 6-Sekunden-Regel wird beim ersten Mal nur mit Freistoß geahndet. Eine Verwarnung wäre nur bei wiederholtem Vergehen oder deutlicher Spielverzögerung angemessen.",
        "Rote Karte": "Ein Feldverweis ist hier unter keinen Umständen gerechtfertigt."
      }
    },
    {
      "id": "E4",
      "name": "Begünstigte Mannschaft",
      "korrekte_werte": ["Gastmannschaft", "angreifende Mannschaft", "gegnerische Mannschaft"],
      "gewicht": "optional",
      "punkte_anteil": 0,
      "synonyme": ["Gäste", "andere Mannschaft"]
    }
  ]
}
```

#### Ebene 3: Teilpunkt-Logik

```json
{
  "punktevergabe": {
    "max_punkte": 2,
    "regeln": [
      {
        "punkte": 2,
        "bedingung": "Alle Pflicht-Elemente korrekt",
        "beschreibung": "Spielfortsetzungstyp UND Ausführungsort UND persönliche Strafe korrekt"
      },
      {
        "punkte": 1,
        "bedingung": "Spielfortsetzungstyp korrekt, aber Ort oder Strafe falsch",
        "beschreibung": "Kernentscheidung richtig, Details fehlerhaft"
      },
      {
        "punkte": 1,
        "bedingung": "Persönliche Strafe korrekt + Spielfortsetzung falsch",
        "beschreibung": "Disziplinarentscheidung richtig, Spielfortsetzung falsch"
      },
      {
        "punkte": 0,
        "bedingung": "Kein Pflichtelement korrekt ODER leere Antwort",
        "beschreibung": "Grundlegendes Verständnis fehlt"
      }
    ]
  }
}
```

#### Ebene 4: Didaktische Metadaten (für Lernbegleitung)

```json
{
  "didaktik": {
    "lernziel": "Unterscheidung direkter/indirekter Freistoß bei Torwart-Vergehen",
    "voraussetzungen": ["Regel 12 Grundlagen", "Spielfortsetzungen Übersicht"],
    "verwandte_fragen": ["SR-2026-007", "SR-2026-015"],
    "haeufigste_verwechslung": "Verwechslung mit direktem Freistoß → Strafstoß-Kette",
    "erklaerung_bei_fehler": "Torwart-Vergehen nach Regel 12.2 (Ball zu lange halten, doppelte Berührung, etc.) werden immer mit einem indirekten Freistoß bestraft. Der Unterschied zu direkten Vergehen (Treten, Halten eines Gegners) ist entscheidend, weil im Strafraum nur direkte Vergehen zum Strafstoß führen."
  }
}
```

---

## Hebel 2: Die Bewertungslogik – System-Prompt-Architektur

### Schicht 1: Rollen-Definition

```
Du bist ein erfahrener DFB-Lehrwart, der Schiedsrichter-Prüfungen bewertet.
Deine Aufgabe ist es, die Antwort eines Prüflings auf eine Regelfrage fair,
differenziert und nachvollziehbar zu bewerten.
```

### Schicht 2: Verarbeitungsregeln (die 10 Gebote des Prüfers)

```
BEWERTUNGSREGELN — befolge diese strikt:

1. LEERE ANTWORTEN
   Wenn das Feld "antwort" leer ist, nur Whitespace enthält, oder
   "keine Antwort" / "-" / "?" lautet:
   → Sofort 0 Punkte vergeben
   → feedback: "Keine Antwort abgegeben."
   → KEINE weitere Analyse durchführen
   → NIEMALS eine Antwort erfinden oder annehmen

2. ISOLIERTE BEWERTUNG
   Bewerte ausschließlich die Antwort zur aktuellen Frage.
   Dir werden keine anderen Fragen gezeigt. Falls doch:
   Ignoriere alles außer der aktuellen Frage-ID.

3. SEMANTISCHER VERGLEICH
   Vergleiche die Antwort inhaltlich mit den Bewertungselementen.
   Nutze die "synonyme"-Listen. Akzeptiere jede Formulierung,
   die denselben Sachverhalt korrekt beschreibt.

4. ELEMENT-WEISE BEWERTUNG
   Prüfe jedes Bewertungselement einzeln.
   Entscheide pro Element: korrekt / falsch / nicht erwähnt.
   Berechne Punkte gemäß der Teilpunkt-Logik.

5. DIFFERENZIERTES FEEDBACK
   Erkläre bei jedem falschen Element, WARUM es falsch ist.
   Nutze dafür die "falsche_alternativen"-Erklärungen aus den Metadaten.
   Gib bei teilweise richtigen Antworten an, was korrekt war.

6. KEINE ÜBERINTERPRETATION
   Wenn die Antwort mehrdeutig ist, wähle die naheliegendste
   Interpretation zugunsten des Prüflings.

7. KONSISTENTE STRENGE
   Gleiche Antworten müssen immer gleich bewertet werden.
   Orientiere dich ausschließlich an den Bewertungselementen.

8. KEINE EIGENEN REGELN
   Bewerte nur anhand der bereitgestellten Metadaten.
   Ergänze keine eigenen Regelkenntnisse, die den Metadaten
   widersprechen könnten.

9. FEHLANNAHMEN ERKENNEN
   Wenn die Antwort einer bekannten "falschen_alternative" entspricht,
   markiere dies im Feld "erkannte_fehlannahme".

10. LERNFÖRDERLICHES FEEDBACK
    Formuliere Feedback so, dass der Prüfling daraus lernen kann.
    Nenne die korrekte Antwort und erkläre den Unterschied.
```

### Schicht 3: Ein-/Ausgabeformat

```
EINGABE (du erhältst):
{
  "frage": { ... vollständige Metadaten ... },
  "antwort": "Text des Prüflings"
}

AUSGABE (du antwortest mit diesem JSON):
{
  "frage_id": "SR-2026-003",
  "antwort_leer": false,
  "punkte": 1,
  "max_punkte": 2,
  "bewertung_elemente": [
    {
      "element_id": "E1",
      "element_name": "Spielfortsetzungstyp",
      "korrekt": true,
      "prüfling_sagte": "indirekter Freistoß",
      "erwartet": "indirekter Freistoß",
      "kommentar": "Korrekt erkannt."
    },
    {
      "element_id": "E2",
      "element_name": "Ausführungsort",
      "korrekt": false,
      "prüfling_sagte": "Strafraumgrenze",
      "erwartet": "Stelle des Vergehens",
      "kommentar": "Der Freistoß wird am Ort des Vergehens ausgeführt, nicht an der Strafraumgrenze."
    },
    {
      "element_id": "E3",
      "element_name": "Persönliche Strafe",
      "korrekt": false,
      "prüfling_sagte": null,
      "erwartet": "keine",
      "kommentar": "Keine Aussage zur persönlichen Strafe getroffen."
    }
  ],
  "erkannte_fehlannahme": "Strafraumgrenze als Ausführungsort",
  "feedback": "Gut erkannt, dass es sich um einen indirekten Freistoß handelt. Der Ausführungsort ist jedoch nicht die Strafraumgrenze, sondern die Stelle, an der der Torwart den Ball gehalten hat. Auch fehlt die Angabe zur persönlichen Strafe (hier: keine).",
  "lernhinweis": "Torwart-Vergehen nach Regel 12.2 werden immer mit einem indirekten Freistoß am Tatort bestraft. Merkhilfe: 'Indirekt = im Strafraum kein Strafstoß.'"
}
```

---

## Hebel 3: Die Lernschleife – Vom Einzelergebnis zur Verbesserung

### Stufe 1: Rohdaten sammeln

Nach jeder Prüfung werden gespeichert:

```json
{
  "pruefung_id": "P-2026-0042",
  "prüfling_id": "anonym-hash",
  "datum": "2026-02-23",
  "ergebnisse": [
    {
      "frage_id": "SR-2026-003",
      "punkte": 1,
      "max_punkte": 2,
      "elemente_korrekt": ["E1"],
      "elemente_falsch": ["E2", "E3"],
      "erkannte_fehlannahme": "Strafraumgrenze als Ausführungsort",
      "antwort_hash": "abc123",
      "bewertungsdauer_ms": 1200
    }
  ]
}
```

### Stufe 2: Aggregierte Statistiken berechnen

#### Pro Prüfling (Lernprofil)

```json
{
  "prüfling_id": "anonym-hash",
  "gesamt_statistik": {
    "prüfungen_absolviert": 5,
    "durchschnitt_prozent": 62,
    "trend": "steigend",
    "trend_detail": [45, 52, 58, 67, 72]
  },
  "staerken": [
    {
      "kategorie": "Abseits",
      "richtig_prozent": 85,
      "status": "gut verinnerlicht"
    },
    {
      "kategorie": "Vorteil / Vorteilsbestimmung",
      "richtig_prozent": 80,
      "status": "gut verinnerlicht"
    }
  ],
  "schwaechen": [
    {
      "kategorie": "Torwart-Vergehen",
      "richtig_prozent": 30,
      "status": "Wiederholung dringend empfohlen",
      "typische_fehler": [
        "Verwechslung direkter/indirekter Freistoß (4x)",
        "Ausführungsort falsch (3x)"
      ],
      "empfohlene_fragen": ["SR-2026-003", "SR-2026-007", "SR-2026-015"]
    },
    {
      "kategorie": "Doppelvergehen",
      "richtig_prozent": 25,
      "status": "Wiederholung dringend empfohlen",
      "typische_fehler": [
        "Nur ein Vergehen erkannt statt beide (5x)"
      ]
    }
  ],
  "element_analyse": {
    "spielfortsetzungstyp_korrekt": "72%",
    "ausfuehrungsort_korrekt": "45%",
    "persoenliche_strafe_korrekt": "68%",
    "schwächstes_element": "Ausführungsort"
  },
  "naechste_empfehlung": "Fokus auf Kapitel 'Spielfortsetzungen und Ausführungsorte', insbesondere Unterschied Tatort vs. Strafraumgrenze vs. Torlinie."
}
```

#### Pro Frage (Fragen-Qualität)

```json
{
  "frage_id": "SR-2026-003",
  "statistik": {
    "total_beantwortet": 240,
    "durchschnitt_punkte": 1.1,
    "schwierigkeitsgrad_empirisch": 3.2,
    "schwierigkeitsgrad_gesetzt": 3,
    "kalibrierung": "passt"
  },
  "häufigste_fehler": [
    {"fehler": "direkter Freistoß statt indirekter", "häufigkeit": 38, "prozent": 16},
    {"fehler": "Strafstoß", "häufigkeit": 22, "prozent": 9},
    {"fehler": "Gelbe Karte zusätzlich", "häufigkeit": 18, "prozent": 8}
  ],
  "element_schwierigkeit": {
    "E1_spielfortsetzungstyp": {"richtig_prozent": 65},
    "E2_ausfuehrungsort": {"richtig_prozent": 42},
    "E3_persoenliche_strafe": {"richtig_prozent": 78}
  },
  "aktion": "E2 (Ausführungsort) ist das schwierigste Element → Erklärungstext in Metadaten erweitern"
}
```

#### Pro Regelbereich (Curriculum-Steuerung)

```json
{
  "regelbereich": "Regel 12 – Fouls und unsportliches Betragen",
  "unterkategorien": [
    {"name": "Torwart-Vergehen", "durchschnitt": 52, "trend": "stabil"},
    {"name": "Handspiel", "durchschnitt": 61, "trend": "steigend"},
    {"name": "Tätlichkeit vs. rohes Spiel", "durchschnitt": 38, "trend": "fallend"}
  ],
  "empfehlung": "Tätlichkeit vs. rohes Spiel: Zusätzliche Übungsfragen erstellen, Erklärungstexte überarbeiten"
}
```

### Stufe 3: Feedback-Loop zur Modellverbesserung

```
┌──────────────────────────────────────────────────────────────┐
│                    KONTINUIERLICHER KREISLAUF                │
│                                                              │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐               │
│  │Prüfung  │───→│ Haiku    │───→│ Ergebnis  │               │
│  │abgelegt │    │ bewertet │    │ gespeichert│              │
│  └─────────┘    └──────────┘    └─────┬─────┘               │
│                                       │                      │
│                                       ▼                      │
│                              ┌────────────────┐              │
│                              │ Stichproben-    │              │
│                              │ Überprüfung     │              │
│                              │ (manuell, 10%)  │              │
│                              └───────┬────────┘              │
│                                      │                       │
│                          ┌───────────┴───────────┐           │
│                          ▼                       ▼           │
│                   ┌─────────────┐        ┌──────────────┐    │
│                   │ Bewertung   │        │ Bewertung    │    │
│                   │ KORREKT     │        │ FEHLERHAFT   │    │
│                   └──────┬──────┘        └──────┬───────┘    │
│                          │                      │            │
│                          ▼                      ▼            │
│                   Bestätigung           ┌──────────────┐     │
│                   → Confidence          │ Fehler-       │    │
│                     Score steigt        │ Klassifikation│    │
│                                         └──────┬───────┘     │
│                                                │             │
│                          ┌─────────────────────┤             │
│                          ▼                     ▼             │
│                   ┌─────────────┐      ┌──────────────┐      │
│                   │ Metadaten   │      │ Prompt       │      │
│                   │ erweitern   │      │ anpassen     │      │
│                   │ (Synonyme,  │      │ (Regeln      │      │
│                   │  Fehler)    │      │  schärfen)   │      │
│                   └──────┬──────┘      └──────┬───────┘      │
│                          │                    │              │
│                          └────────┬───────────┘              │
│                                   ▼                          │
│                          ┌────────────────┐                  │
│                          │ A/B-Test       │                  │
│                          │ neue Version   │                  │
│                          │ vs. alte       │                  │
│                          └────────┬───────┘                  │
│                                   │                          │
│                                   ▼                          │
│                          Bessere Version                     │
│                          wird produktiv                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Stufe 4: Automatische Qualitätssicherung

#### Konsistenz-Check

Gleiche oder sehr ähnliche Antworten auf dieselbe Frage sollten gleich bewertet werden. Dafür:

```
Für jede Frage:
  1. Sammle alle Antworten mit identischem Wortlaut
  2. Prüfe: Wurden sie alle gleich bewertet?
  3. Falls nicht → Inkonsistenz-Flag → Prompt/Metadaten überarbeiten

Messgröße: Konsistenz-Rate = identische Bewertungen / identische Antworten
Ziel: > 98%
```

#### Halluzinations-Detektion

```
Für jede Bewertung:
  1. War die Antwort leer?
  2. Enthält die Bewertung "prüfling_sagte: [irgendetwas]"?
  3. Falls ja → HALLUZINATION → sofort loggen und melden

Messgröße: Halluzinationsrate bei leeren Antworten
Ziel: 0%
```

#### Teilpunkt-Fairness

```
Für jede Bewertung mit 0 Punkten:
  1. War mindestens ein Element korrekt?
  2. Falls ja → Potenzielle Teilpunkt-Verweigerung → Review

Messgröße: False-Zero-Rate
Ziel: < 2%
```

---

## Praktische Implementierung: 3-Phasen-Plan

### Phase 1: Metadaten aufbauen (Wochen 1–4)

**Aufwand:** Einmalig, manuell, aber entscheidend.

Für jede der ca. 30 Regelfragen:

1. Musterantwort in Bewertungselemente zerlegen
2. Pro Element: Synonyme definieren (3–5 pro Element)
3. Pro Element: Falsche Alternativen mit Erklärung notieren
4. Teilpunkt-Logik festlegen
5. Didaktische Metadaten ergänzen (Lernziel, verwandte Fragen, Erklärung bei Fehler)
6. Tags und Kategorien zuweisen

**Datenformat:** JSON-Dateien, eine pro Frage, in einem Verzeichnis strukturiert nach Regelbereich.

### Phase 2: Bewertungs-Pipeline aufbauen (Wochen 3–6)

```
Prüfling gibt Antwort ab
        │
        ▼
┌──────────────────┐
│ Vorverarbeitung  │  → Leere Antwort? → 0P, kein API-Call
│ (Server-seitig)  │  → Antwort trimmen, normalisieren
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ API-Call an       │  → Frage-Metadaten + Antwort + System-Prompt
│ Claude Haiku      │  → Eine Frage pro Call (keine Batch-Bewertung!)
│                   │  → JSON-Response erzwingen
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Nachverarbeitung │  → JSON parsen und validieren
│ (Server-seitig)  │  → Punkte-Plausibilitätsprüfung
│                   │  → In Datenbank speichern
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Feedback an       │  → Punkte + Element-Bewertung + Lernhinweis
│ Prüfling          │  → Verwandte Übungsfragen vorschlagen
└──────────────────┘
```

### Phase 3: Lernschleife aktivieren (ab Woche 6)

1. **Stichproben-Review einführen:** 10% der Bewertungen manuell prüfen
2. **Dashboards bauen:** Prüflings-Profile, Fragen-Statistiken, Fehlannahmen-Heatmap
3. **Automatische Alerts:** Bei Konsistenz < 95%, Halluzinationsrate > 0%, neue häufige Fehlannahmen
4. **Metadaten iterativ erweitern:** Neue Synonyme, neue falsche Alternativen aus Realdaten
5. **Prompt-Versioning:** Jede Änderung am System-Prompt versionieren und per A/B-Test validieren

---

## Zusammenfassung: Was wird benötigt

| Komponente | Status bei Schiri.App | Empfehlung |
|---|---|---|
| Fragen + Musterantworten | Vorhanden | Beibehalten |
| Zerlegte Bewertungselemente | Fehlt | Aufbauen (Phase 1) |
| Synonym-Listen | Fehlt | Aufbauen (Phase 1) |
| Falsche Alternativen + Erklärungen | Fehlt | Aufbauen (Phase 1) |
| Teilpunkt-Logik pro Frage | Fehlt | Definieren (Phase 1) |
| Leere-Antworten-Guard | Fehlt | Sofort implementieren |
| Einzelbewertung pro Frage | Unklar | Sicherstellen (Phase 2) |
| Strukturierter System-Prompt | Fehlt/unvollständig | Implementieren (Phase 2) |
| JSON-Output-Erzwingung | Fehlt | Implementieren (Phase 2) |
| Didaktische Metadaten | Fehlt | Aufbauen (Phase 1–2) |
| Prüflings-Statistiken | Fehlt | Dashboard (Phase 3) |
| Konsistenz-Monitoring | Fehlt | Automatisieren (Phase 3) |
| Feedback-Loop | Fehlt | Prozess einführen (Phase 3) |
