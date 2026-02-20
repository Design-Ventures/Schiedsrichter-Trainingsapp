#!/usr/bin/env python3
"""
Enrich questions-preview.json with:
- sourceDate (from issue number)
- ruleReference (from keyword analysis against DFB Regelheft 2025/2026)
- tags (topic categories)
- explanation (reasoning extracted from correctAnswer + rule context)
"""

import json
import re
from datetime import datetime

# ============================================================
# 1. Source date mapping
# ============================================================
# SR-Zeitung: bimonthly (6 issues/year)
# SR-Newsletter: roughly monthly

SOURCE_DATES = {
    "SR-Zeitung 01/2025": "2025-01-01",
    "SR-Zeitung 02/2025": "2025-03-01",
    "SR-Zeitung 03/2025": "2025-05-01",
    "SR-Zeitung 04/2025": "2025-07-01",
    "SR-Zeitung 05/2025": "2025-09-01",
    "SR-Zeitung 06/2025": "2025-11-01",
    "SR-Zeitung 01/2026": "2026-01-01",
    "SR-Zeitung 02/2026": "2026-03-01",
    "SR-Newsletter 01/2025": "2025-01-15",
    "SR-Newsletter 02/2025": "2025-02-15",
    "SR-Newsletter 03/2025": "2025-03-15",
    "SR-Newsletter 04/2025": "2025-04-15",
    "SR-Newsletter 05/2025": "2025-05-15",
    "SR-Newsletter 06/2025": "2025-06-15",
}

# ============================================================
# 2. Rule reference mapping (DFB Fußball-Regeln 2025/2026)
# ============================================================
# Regel 1:  Spielfeld
# Regel 2:  Ball
# Regel 3:  Spieler
# Regel 4:  Ausrüstung der Spieler
# Regel 5:  Schiedsrichter
# Regel 6:  Weitere Spieloffizielle
# Regel 7:  Dauer des Spiels
# Regel 8:  Beginn und Fortsetzung des Spiels
# Regel 9:  Ball im und aus dem Spiel
# Regel 10: Bestimmung des Spielausgangs
# Regel 11: Abseits
# Regel 12: Fouls und sonstiges Fehlverhalten
# Regel 13: Freistöße
# Regel 14: Strafstoß
# Regel 15: Einwurf
# Regel 16: Abstoß
# Regel 17: Eckstoß

RULE_NAMES = {
    1: "Spielfeld",
    2: "Ball",
    3: "Spieler",
    4: "Ausrüstung der Spieler",
    5: "Schiedsrichter",
    6: "Weitere Spieloffizielle",
    7: "Dauer des Spiels",
    8: "Beginn und Fortsetzung des Spiels",
    9: "Ball im und aus dem Spiel",
    10: "Bestimmung des Spielausgangs",
    11: "Abseits",
    12: "Fouls und sonstiges Fehlverhalten",
    13: "Freistöße",
    14: "Strafstoß",
    15: "Einwurf",
    16: "Abstoß",
    17: "Eckstoß",
}

# Keywords that indicate a specific rule applies.
# Order matters: more specific patterns first.
# Each entry: (regex_pattern, rule_number, weight)
RULE_KEYWORDS = [
    # Regel 14 - Strafstoß
    (r'\b[Ss]trafstoß', 14, 10),
    (r'\b[Ee]lfmeter(?!schieß)', 14, 10),
    (r'\b[Ss]chütze\b', 14, 6),
    (r'\bStrafstoßausführung', 14, 10),
    (r'\bPenalty', 14, 8),
    (r'\bzu früh in den Strafraum', 14, 8),

    # Regel 11 - Abseits
    (r'\b[Aa]bseits', 11, 10),
    (r'\bAbseitsstellung', 11, 10),
    (r'\bAbseitsvergehen', 11, 10),
    (r'\bstrafbare.{0,15}Abseits', 11, 10),

    # Regel 15 - Einwurf
    (r'\b[Ee]inwurf', 15, 10),
    (r'\beinwerfen', 15, 8),
    (r'\bSeitenlinie.{0,30}[Bb]all.{0,20}verlassen', 15, 6),

    # Regel 16 - Abstoß
    (r'\b[Aa]bstoß', 16, 10),
    (r'\bTorwart.{0,30}Abstoß', 16, 10),

    # Regel 17 - Eckstoß
    (r'\b[Ee]ckstoß', 17, 10),
    (r'\b[Ee]ckball', 17, 8),
    (r'\b[Ee]ckfahne', 17, 4),

    # Regel 13 - Freistöße
    (r'\b[Dd]irekter Freistoß', 13, 8),
    (r'\b[Ii]ndirekter Freistoß', 13, 8),
    (r'\b[Ff]reistoß', 13, 6),
    (r'\bMauer\b', 13, 5),

    # Regel 10 - Spielausgang / Elfmeterschießen
    (r'\b[Ee]lfmeterschieß', 10, 10),
    (r'\b[Tt]or.{0,10}zählt', 10, 6),
    (r'\b[Kk]ein Tor\b', 10, 6),
    (r'\bSpielausgang', 10, 8),
    (r'\bgültiges Tor', 10, 6),

    # Regel 12 - Fouls und sonstiges Fehlverhalten
    (r'\b[Vv]erwarnung', 12, 7),
    (r'\b[Ff]eldverweis', 12, 8),
    (r'\bGelb/Rot\b', 12, 8),
    (r'\bGelbe Karte', 12, 7),
    (r'\bRote Karte', 12, 8),
    (r'\b[Hh]andspiel', 12, 9),
    (r'\b[Ff]oul', 12, 7),
    (r'\b[Tt]ätlichkeit', 12, 9),
    (r'\bunsportlich', 12, 6),
    (r'\b[Ss]chwalbe', 12, 7),
    (r'\bDOGSO', 12, 9),
    (r'\b[Nn]otbremse', 12, 8),
    (r'\boffensichtliche.{0,10}Torchance', 12, 8),
    (r'\bklare Torchance', 12, 8),
    (r'\b[Ss]pucken', 12, 7),
    (r'\b[Ss]chlagen', 12, 5),
    (r'\b[Bb]einstellen', 12, 6),
    (r'\b[Hh]alten', 12, 3),
    (r'\b[Kk]ontaktvergehen', 12, 7),
    (r'\bverzögert.{0,20}Spielfortsetzung', 12, 6),
    (r'\bKritik\b', 12, 5),
    (r'\bBeleidigung', 12, 7),
    (r'\bProtestieren', 12, 5),
    (r'\bErdklumpen', 12, 6),
    (r'\bWerfen.{0,15}Gegenstand', 12, 6),
    (r'\b[Pp]ersönliche.{0,5}Strafe', 12, 8),
    (r'\b[Gg]efährliches Spiel', 12, 7),
    (r'\bZweikampf', 12, 4),
    (r'\bVerhinderung.{0,30}Torchance', 12, 8),

    # Regel 5 - Schiedsrichter
    (r'\b[Ss]chiedsrichter.{0,10}(entscheid|Entscheid)', 5, 5),
    (r'\b[Vv]orteil\b', 5, 6),
    (r'\bSpielabbruch', 5, 9),
    (r'\bPublic Announcement', 5, 10),
    (r'\bKapitänsdialog', 5, 10),
    (r'\bAnsprechpartner', 5, 8),
    (r'\b[Ss]pielbericht', 5, 8),
    (r'\bSchiedsrichter.{0,10}pfeif', 5, 5),
    (r'\bVorteil.{0,10}(geben|gewähr|spiel)', 5, 7),
    (r'\bKarenzzeit', 5, 7),
    (r'\bSignalkarte', 5, 6),
    (r'\b[Rr]evidier', 5, 6),

    # Regel 6 - Weitere Spieloffizielle
    (r'\bAssistent', 6, 7),
    (r'\bSchiedsrichter-Assistent', 6, 9),
    (r'\bVAR\b', 6, 10),
    (r'\bVideo', 6, 6),

    # Regel 7 - Dauer des Spiels
    (r'\bVerlängerung', 7, 7),
    (r'\bNachspielzeit', 7, 9),
    (r'\bSchlusspfiff', 7, 7),
    (r'\bSpielende', 7, 7),
    (r'\bHalbzeit', 7, 6),
    (r'\bAnstoßzeit', 7, 6),
    (r'\bZeitspiel', 7, 6),
    (r'\bacht Sekunden', 7, 4),
    (r'\b[Rr]unterzählen', 7, 4),

    # Regel 8 - Beginn und Fortsetzung
    (r'\b[Aa]nstoß', 8, 7),
    (r'\b[Ss]chiedsrichter.?[Bb]all', 8, 10),
    (r'\bSchiedsrichterball', 8, 10),
    (r'\bSpielfortsetzung', 8, 5),
    (r'\bSpiel fortgesetzt', 8, 5),

    # Regel 3 - Spieler
    (r'\b[Aa]uswechsl', 3, 8),
    (r'\b[Ee]inwechsl', 3, 8),
    (r'\b[Rr]ückwechsel', 3, 8),
    (r'\bSpieleranzahl', 3, 7),
    (r'\bsieben Spieler', 3, 7),
    (r'\belf Spieler', 3, 6),
    (r'\bSpielertrainer', 3, 7),
    (r'\b[Tt]eilnahmeberechtigt', 3, 7),
    (r'\bspielberechtigt', 3, 7),
    (r'\babgemeldet\b', 3, 6),

    # Regel 4 - Ausrüstung
    (r'\b[Aa]usrüstung', 4, 9),
    (r'\bTrikot', 4, 8),
    (r'\b[Ss]chmuck', 4, 8),
    (r'\b[Ss]chienbeinschoner', 4, 8),
    (r'\b[Kk]opfbedeckung', 4, 9),
    (r'\b[Mm]ütze', 4, 9),
    (r'\bCap\b', 4, 6),
    (r'\b[Ss]chuhe', 4, 6),
    (r'\bUnterhose', 4, 7),
    (r'\bUnterziehshirt', 4, 7),
    (r'\bSchienbeinschützer', 4, 7),

    # Regel 1 - Spielfeld
    (r'\bSpielfeldmarkierung', 1, 9),
    (r'\b[Hh]ilfsmarkierung', 1, 10),
    (r'\bKreide\b', 1, 7),
    (r'\bHütchen\b', 1, 5),
    (r'\bSchneebedeckt', 1, 6),
    (r'\bPlatzwart', 1, 6),
    (r'\b[Ee]ckfahne', 1, 5),
    (r'\bMittellinie\b', 1, 4),

    # Regel 2 - Ball
    (r'\bErsatzball', 2, 9),
    (r'\b[Bb]all.{0,10}beschädigt', 2, 8),
    (r'\b[Bb]all.{0,10}platzt', 2, 8),

    # Regel 9 - Ball im/aus dem Spiel
    (r'\bBall im Spiel', 9, 8),
    (r'\bBall aus dem Spiel', 9, 8),

    # Torwart-specific rules (Regel 12 section on goalkeeper)
    (r'\bTorhüter.{0,30}(Hand|Händen|aufnimmt|fängt|kontrolliert)', 12, 5),
    (r'\bTorhüter.{0,30}(Sekunden|Ballkontrolle)', 12, 5),
    (r'\bBallkontrolle.{0,20}Torhüter', 12, 5),
    (r'\b[Rr]ückpass', 12, 7),
]

# ============================================================
# 3. Tag classification
# ============================================================
TAG_KEYWORDS = {
    "Persönliche Strafe": [
        r'\b[Vv]erwarnung', r'\b[Ff]eldverweis', r'\bGelb', r'\bRot\b',
        r'\bGelb/Rot', r'\bKarte\b', r'\bpersönliche.{0,5}Strafe',
        r'\bSignalkarte',
    ],
    "Spielfortsetzung": [
        r'\b[Ff]reistoß', r'\b[Ss]trafstoß', r'\b[Ee]inwurf', r'\b[Aa]bstoß',
        r'\b[Ee]ckstoß', r'\b[Ss]chiedsrichterball', r'\b[Aa]nstoß',
        r'\b[Ww]eiterspiel',
    ],
    "Torwart": [
        r'\bTor(hüter|wart)', r'\bTorhüter', r'\bKeeper',
        r'\bTorwart', r'\bBallkontrolle',
    ],
    "Strafstoß": [
        r'\b[Ss]trafstoß', r'\b[Ee]lfmeter(?!schieß)',
        r'\bStrafstoßausführung', r'\b[Ss]chütze',
    ],
    "Elfmeterschießen": [
        r'\b[Ee]lfmeterschieß',
    ],
    "Abseits": [
        r'\b[Aa]bseits',
    ],
    "Handspiel": [
        r'\b[Hh]andspiel', r'\bHand.{0,5}(Ball|spiel)',
        r'\bmit der Hand', r'\bmit dem Arm',
    ],
    "Foulspiel": [
        r'\b[Ff]oul', r'\b[Bb]einstellen', r'\b[Ss]toßen',
        r'\b[Rr]empeln', r'\b[Tt]reten', r'\b[Ss]chlagen',
        r'\bZweikampf', r'\b[Hh]alten.{0,15}Gegner',
        r'\b[Hh]altevergehen',
    ],
    "Unsportliches Verhalten": [
        r'\bunsportlich', r'\b[Ss]chwalbe', r'\b[Ss]imulation',
        r'\bverzögert', r'\bZeitspiel', r'\bKritik',
        r'\bBeleidigung', r'\bProtest', r'\bProvokation',
    ],
    "Tätlichkeit": [
        r'\b[Tt]ätlichkeit', r'\b[Ss]chlagen', r'\b[Ss]pucken',
        r'\b[Bb]eißen', r'\b[Kk]opfstoß',
    ],
    "Notbremse/DOGSO": [
        r'\bDOGSO', r'\b[Nn]otbremse', r'\boffensichtliche.{0,10}Torchance',
        r'\bklare Torchance', r'\bVerhinderung.{0,30}Torchance',
    ],
    "Vorteilsregel": [
        r'\b[Vv]orteil', r'\badvantage',
    ],
    "Auswechslung": [
        r'\b[Aa]uswechsl', r'\b[Ee]inwechsl', r'\b[Rr]ückwechsel',
    ],
    "Ausrüstung": [
        r'\b[Aa]usrüstung', r'\bTrikot', r'\b[Ss]chmuck',
        r'\b[Ss]chienbeinschon', r'\b[Kk]opfbedeckung', r'\b[Mm]ütze',
        r'\bCap\b', r'\b[Ss]chuhe', r'\bUnterhose', r'\bUnterzieh',
    ],
    "Spielfeld": [
        r'\bSpielfeldmarkierung', r'\b[Hh]ilfsmarkierung',
        r'\bKreide', r'\bHütchen', r'\b[Ss]chnee', r'\bPlatzwart',
    ],
    "VAR": [
        r'\bVAR\b', r'\bVideo', r'\bPublic Announcement',
    ],
    "Verlängerung": [
        r'\bVerlängerung',
    ],
    "Schiedsrichter-Entscheidung": [
        r'\bSpielabbruch', r'\b[Ss]pielbericht',
        r'\bKapitänsdialog', r'\bAnsprechpartner',
        r'\b[Rr]evidier',
    ],
}


def get_source_date(source: str) -> str | None:
    return SOURCE_DATES.get(source)


def get_rule_references(situation: str, answer: str) -> str:
    """Determine the most relevant rule reference(s) from text analysis."""
    combined = situation + " " + answer
    scores: dict[int, int] = {}

    for pattern, rule_num, weight in RULE_KEYWORDS:
        matches = re.findall(pattern, combined, re.IGNORECASE)
        if matches:
            scores[rule_num] = scores.get(rule_num, 0) + weight * len(matches)

    if not scores:
        return "Regel 12"  # Default fallback: most common rule in SR questions

    # Sort by score descending
    sorted_rules = sorted(scores.items(), key=lambda x: -x[1])

    # Take top rule(s) - include secondary if score is at least 40% of primary
    primary = sorted_rules[0]
    refs = [primary]
    for rule_num, score in sorted_rules[1:]:
        if score >= primary[1] * 0.4:
            refs.append((rule_num, score))
        else:
            break

    # Limit to 3 rules max
    refs = refs[:3]

    # Format as "Regel X (Name), Regel Y (Name)"
    parts = []
    for rule_num, _ in refs:
        parts.append(f"Regel {rule_num} ({RULE_NAMES[rule_num]})")

    return ", ".join(parts)


def get_tags(situation: str, answer: str) -> list[str]:
    """Assign topic tags based on keyword analysis."""
    combined = situation + " " + answer
    tags = []

    for tag, patterns in TAG_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.append(tag)
                break

    # Ensure at least one tag
    if not tags:
        tags.append("Allgemein")

    return sorted(set(tags))


def get_explanation(situation: str, answer: str, rule_ref: str) -> str:
    """Generate a concise explanation referencing the relevant rule."""
    # The correctAnswer already contains the full explanation.
    # The explanation field adds rule context.
    # Extract the reasoning part (after the direct answer).

    # Split answer into direct answer and reasoning
    # Common patterns: "Nein, because..." "Ja. explanation..."
    # Sentences after the first period often contain reasoning.

    sentences = re.split(r'(?<=[.!?])\s+', answer)

    if len(sentences) <= 1:
        # Short answer, use rule reference as explanation
        return f"Siehe {rule_ref}."

    # The reasoning is everything after the first sentence
    reasoning = " ".join(sentences[1:])

    # Add rule reference prefix
    return f"{reasoning} (Vgl. {rule_ref.split(',')[0]})"


def main():
    with open("data/questions-preview.json", "r", encoding="utf-8") as f:
        questions = json.load(f)

    enriched_count = 0

    for q in questions:
        situation = q.get("situation", "")
        answer = q.get("correctAnswer", "")
        source = q.get("source", "")

        # sourceDate
        sd = get_source_date(source)
        if sd:
            q["sourceDate"] = sd

        # ruleReference
        rule_ref = get_rule_references(situation, answer)
        q["ruleReference"] = rule_ref

        # tags
        tags = get_tags(situation, answer)
        q["tags"] = tags

        # explanation
        explanation = get_explanation(situation, answer, rule_ref)
        q["explanation"] = explanation

        enriched_count += 1

    # Save
    output = json.dumps(questions, ensure_ascii=False, indent=2)
    with open("data/questions-preview.json", "w", encoding="utf-8") as f:
        f.write(output + "\n")

    # Stats
    print(f"Enriched {enriched_count} questions.")
    print()

    # Show distribution of rules
    rule_counts: dict[str, int] = {}
    for q in questions:
        ref = q.get("ruleReference", "?")
        primary = ref.split(",")[0]
        rule_counts[primary] = rule_counts.get(primary, 0) + 1

    print("Rule distribution:")
    for rule, count in sorted(rule_counts.items()):
        print(f"  {rule}: {count}")

    # Show tag distribution
    tag_counts: dict[str, int] = {}
    for q in questions:
        for t in q.get("tags", []):
            tag_counts[t] = tag_counts.get(t, 0) + 1

    print("\nTag distribution:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        print(f"  {tag}: {count}")

    # Show a few examples
    print("\nExamples:")
    for q in questions[:3]:
        print(f"\n  Index {q['index']} ({q['source']}):")
        print(f"    ruleReference: {q['ruleReference']}")
        print(f"    tags: {q['tags']}")
        print(f"    sourceDate: {q.get('sourceDate', 'N/A')}")
        print(f"    explanation: {q['explanation'][:100]}...")

    # Verify JSON
    json.loads(output)
    print("\nJSON valid!")


if __name__ == "__main__":
    main()
