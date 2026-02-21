# Import aller 586 Regelfragen in die App

## Status

- `data/questions-all.json` enthält **586 vollständige Fragen** im App-Format (situation, correctAnswer, criteriaFull, criteriaPartial, tags, ruleReference, explanation, sourceDate)
- `data/questions-preview.json` enthält die alten 145 Fragen (Backup)
- `scripts/import-all-questions.ts` ist das Import-Script
- `package.json` hat den Script-Eintrag `import:all`

## Import durchführen

```bash
# 1. Vorschau (zeigt Statistik, importiert nichts)
npm run import:all

# 2. Neue Fragen importieren (überspringt Duplikate)
npm run import:all -- --import

# 3. Neue importieren + bestehende aktualisieren
npm run import:all -- --import --update
```

## Was das Import-Script macht

1. Liest `data/questions-all.json` (586 Fragen)
2. Für jede Frage: Prüft ob Duplikat existiert (erste 100 Zeichen der `situation`)
3. Falls Duplikat und `--update`: Aktualisiert alle Felder
4. Falls kein Duplikat: Erstellt neuen `RegeltestQuestion`-Eintrag via Prisma
5. Gibt Statistik aus (imported/updated/skipped)

## Datenformat (questions-all.json → Prisma-Schema)

| JSON-Feld | Prisma-Feld | Typ |
|-----------|-------------|-----|
| situation | situation | String (Text) |
| correctAnswer | correctAnswer | String (Text) |
| explanation | explanation | String? (Text) |
| criteriaFull | criteriaFull | String[] |
| criteriaPartial | criteriaPartial | String[] |
| ruleReference | ruleReference | String? |
| source | source | String |
| sourceDate | sourceDate | DateTime? |
| tags | tags | String[] |
| – | isActive | Boolean (default: true) |

## Mögliche Fehler und Lösungen

### Prisma Client nicht generiert
```
Error: @prisma/client did not initialize yet
```
**Fix:** `npx prisma generate`

### Datenbank nicht erreichbar
```
Error: Can't reach database server
```
**Fix:** `.env` prüfen, dass `DATABASE_URL` und `DIRECT_URL` korrekt gesetzt sind

### Migration fehlt
Falls das Schema sich geändert hat:
```bash
npx prisma db push
# oder
npx prisma migrate dev
```

### Duplikat-Erkennung zu aggressiv
Das Script prüft die ersten 100 Zeichen der `situation`. Falls Fragen fälschlich als Duplikat erkannt werden, kann man in `import-all-questions.ts` Zeile 47 den Wert anpassen:
```typescript
situation: {
  startsWith: q.situation.substring(0, 100), // ← hier anpassen
}
```

### sourceDate Parse-Fehler
`sourceDate` ist im Format `"2013-01-01"`. Falls Prisma das nicht akzeptiert, liegt es an der Zeitzone. Fix in `import-all-questions.ts`:
```typescript
sourceDate = new Date(q.sourceDate + "T00:00:00Z"); // UTC erzwingen
```

## Herkunft der Daten

- **Quelle:** 80 DFB-SRZ PDFs (2013–2026) aus `~/Dokumente/SRZ-Sammlung/`
- **Extraktion:** `~/Dokumente/SRZ-JSON/extract_srz_regelfragen.py` (Python, nutzt pdftotext -layout)
- **Konvertierung:** Separates Python-Script hat die 586 SRZ-JSON-Fragen ins App-Format transformiert
- **Kriterien:** Automatisch aus Antworttext extrahiert (Strafstoß, Feldverweis, Verwarnung, etc.)
- **Tags:** Automatisch via Keyword-Matching generiert

## Neue Dateien im Repo

- `data/questions-all.json` – 586 Fragen im App-Format (767 KB)
- `scripts/import-all-questions.ts` – Import-Script mit --import und --update Flags
- `IMPORT-ANLEITUNG.md` – Diese Datei (kann nach Import gelöscht werden)
