import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PDF_PATH = path.resolve(
  "data/Schiedsrichterfragen",
  "Schiedsrichterfragen 2025:2026 Zeitung und Newsletter.pdf",
);
const PREVIEW_PATH = path.resolve("data/questions-preview.json");
const TOTAL_PAGES = 24;

// PDF crop regions (A4 = 595.28 x 841.89 pts)
const LEFT_CROP = { x: 0, y: 0, w: 298, h: 842 };
const RIGHT_CROP = { x: 298, y: 0, w: 298, h: 842 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedQuestion {
  situation: string;
  correctAnswer: string;
  source: string;
  criteriaFull: string[];
  criteriaPartial: string[];
}

// ---------------------------------------------------------------------------
// PDF text extraction via pdftotext (poppler)
// ---------------------------------------------------------------------------

function extractColumn(
  page: number,
  crop: { x: number; y: number; w: number; h: number },
): string {
  try {
    return execSync(
      `pdftotext -x ${crop.x} -y ${crop.y} -W ${crop.w} -H ${crop.h} -f ${page} -l ${page} "${PDF_PATH}" -`,
      { maxBuffer: 10 * 1024 * 1024 },
    ).toString("utf-8");
  } catch {
    console.error(
      "Error: pdftotext not found. Install poppler: brew install poppler",
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Ligature & OCR artifact cleanup
// ---------------------------------------------------------------------------

const LIGATURE_FIXES: [RegExp, string][] = [
  // ff ligatures (must come before fi/fl to avoid partial matches)
  [/Au orderung/g, "Aufforderung"],
  [/au orderung/g, "aufforderung"],
  [/au ordern/g, "auffordern"],
  [/Angri s\b/g, "Angriffs"],
  [/Angri e\b/g, "Angriffe"],
  [/Angri\b/g, "Angriff"],
  [/angri\b/g, "angriff"],
  [/Tre er/g, "Treffer"],
  [/tre er/g, "treffer"],
  [/o ensichtlich/g, "offensichtlich"],
  [/O ensichtlich/g, "Offensichtlich"],
  [/o enkundig/g, "offenkundig"],
  [/O enkundig/g, "Offenkundig"],
  [/o enbar/g, "offenbar"],
  [/O enbar/g, "Offenbar"],
  [/(?<=\s|^)o en\b/g, "offen"],
  [/(?<=\s|^)O en\b/g, "Offen"],
  [/Eingri\b/g, "Eingriff"],
  [/eingri\b/g, "eingriff"],
  [/Scha ung/g, "Schaffung"],
  [/Schlussp\b/g, "Schlusspfiff"],
  [/tri t\b/g, "trifft"],
  [/Tri t\b/g, "Trifft"],
  [/Teamo ziell/g, "Teamoffiziell"],
  [/teamo ziell/g, "teamoffiziell"],
  [/(?<=\s|^)o ziell/g, "offiziell"],
  [/(?<=\s|^)O ziell/g, "Offiziell"],

  // fi ligatures
  [/be ndet/g, "befindet"],
  [/be nden/g, "befinden"],
  [/be ndlich/g, "befindlich"],
  [/de niert/g, "definiert"],
  [/De nition/g, "Definition"],
  [/de nitiv/g, "definitiv"],
  [/De nitiv/g, "Definitiv"],
  [/(?<=\s|^)ndet\b/g, "findet"],
  [/(?<=\s|^)xiert/g, "fixiert"],

  // fl ligatures
  [/Ein uss/g, "Einfluss"],
  [/ein uss/g, "einfluss"],
  [/Verp ichtung/g, "Verpflichtung"],
  [/verp ichtet/g, "verpflichtet"],
  [/verp ichten/g, "verpflichten"],
  [/emp ehlen/g, "empfehlen"],
  [/Emp ehlung/g, "Empfehlung"],
  [/emp nden/g, "empfinden"],
  [/Au lauf/g, "Auflauf"],
  [/Au ösung/g, "Auflösung"],
  [/ö net/g, "öffnet"],
  [/(?<=\s|^)iegt\b/g, "fliegt"],
  [/(?<=\s|^)iegende/g, "fliegende"],
];

function fixLigatures(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LIGATURE_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function isArtifactLine(line: string): boolean {
  const stripped = line.replace(/\s/g, "");
  if (stripped.length === 0) return true;
  // Stray ligature characters dumped at page boundaries
  if (/^[fifl]{1,3}$/.test(stripped)) return true;
  return false;
}

function cleanText(text: string): string {
  let result = text.replace(/\s+/g, " ").trim();
  result = fixLigatures(result);
  return result;
}

// ---------------------------------------------------------------------------
// Left column parser: extract questions with sources
// ---------------------------------------------------------------------------

const SOURCE_PATTERN = /(SR-Zeitung|SR-Newsletter)\s+(\d+\/\d+)/;

interface RawQuestion {
  text: string;
  source: string;
}

function parseLeftColumn(text: string): RawQuestion[] {
  const lines = text.split("\n");
  const questions: RawQuestion[] = [];
  let currentText = "";

  for (const line of lines) {
    if (isArtifactLine(line)) continue;
    if (line.trim() === "Regelfrage") continue;

    const trimmed = line.trim();
    const sourceMatch = trimmed.match(SOURCE_PATTERN);

    if (sourceMatch) {
      // Text before the source on the same line is still question text
      const beforeSource = trimmed
        .substring(0, trimmed.indexOf(sourceMatch[0]))
        .trim();
      if (beforeSource) {
        currentText += " " + beforeSource;
      }

      const source = `${sourceMatch[1]} ${sourceMatch[2]}`;
      if (currentText.trim()) {
        questions.push({ text: currentText.trim(), source });
      }
      currentText = "";
    } else if (trimmed) {
      currentText += (currentText ? " " : "") + trimmed;
    }
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Right column parser: split answer text into blocks
// ---------------------------------------------------------------------------

// Patterns that typically start a new answer
const ANSWER_START_PATTERNS = [
  // Ja/Nein
  /^Ja[.,;:\s]/,
  /^Nein[.,;:\s]/,
  // Spielstrafen
  /^Strafsto[ßs]/,
  /^Direkter\s+Freisto[ßs]/i,
  /^Indirekter\s+Freisto[ßs]/i,
  /^Weiterspielen/,
  /^Kein\s+Tor/,
  /^Kein\s+Abseits/,
  /^Tor[.,;:\s]/,
  /^Ecksto[ßs]/,
  /^Einwurf/,
  /^Absto[ßs]/,
  /^Ansto[ßs]/,
  /^Schiedsrichter-?[Bb]all/,
  /^Wiederholung/,
  // Persönliche Strafen
  /^Feldverweis/,
  /^Rote\s+Karte/,
  /^Gelbe\s+Karte/,
  /^Gelb\/Rot/,
  /^Gelb,\s*Gelb\/Rot/,
  /^Verwarnung/,
  /^Ausschluss/,
  // Sonstige
  /^Spielunterbrechung/,
  /^Spielende/,
  /^Spielabbruch/,
  /^Meldung/,
  // Specific sentence starters that reliably indicate a new answer
  // NOTE: avoid generic starters like "Der Spieler", "Der Schiedsrichter" etc.
  // as these frequently appear within answer text
  /^Die\s+Strafstoß-Entscheidung/,
  /^Die\s+Zeit\s+läuft/,
  /^Die\s+ersten\s+drei/,
  /^Es\s+gibt\s+keine\s+Persönliche/i,
  /^Reihenfolge/,
  /^Keine\s+Persönliche\s+Strafe/i,
  /^Korrekterweise/,
];

function looksLikeAnswerStart(text: string): boolean {
  return ANSWER_START_PATTERNS.some((p) => p.test(text));
}

function parseRightColumn(text: string, expectedCount: number): string[] {
  const lines = text.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    // Keep blank lines — they're needed for block splitting
    if (line.trim() === "") {
      cleanLines.push(line);
      continue;
    }
    if (isArtifactLine(line)) continue;
    if (line.trim() === "Antwort") continue;
    cleanLines.push(line);
  }

  // Step 1: Split by blank lines into initial blocks
  const rawBlocks: string[] = [];
  let currentBlock = "";

  for (const line of cleanLines) {
    if (line.trim() === "") {
      if (currentBlock.trim()) {
        rawBlocks.push(currentBlock.trim());
      }
      currentBlock = "";
    } else {
      currentBlock += (currentBlock ? " " : "") + line.trim();
    }
  }
  if (currentBlock.trim()) {
    rawBlocks.push(currentBlock.trim());
  }

  // If block count matches, we're done
  if (rawBlocks.length === expectedCount) {
    return rawBlocks;
  }

  // Step 2: Need more blocks — try to split merged blocks at answer-start patterns
  if (rawBlocks.length < expectedCount) {
    const refinedBlocks: string[] = [];

    for (const block of rawBlocks) {
      // Try to find answer-start patterns within the block (not at position 0)
      const sentences = splitAtAnswerBoundaries(block);
      refinedBlocks.push(...sentences);
    }

    if (refinedBlocks.length === expectedCount) {
      return refinedBlocks;
    }

    // Step 3: If still not matching, try line-by-line answer-start detection
    const lineBlocks: string[] = [];
    let currentAns = "";

    for (const line of cleanLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentAns.trim()) {
          lineBlocks.push(currentAns.trim());
          currentAns = "";
        }
        continue;
      }

      if (currentAns && looksLikeAnswerStart(trimmed)) {
        lineBlocks.push(currentAns.trim());
        currentAns = trimmed;
      } else {
        currentAns += (currentAns ? " " : "") + trimmed;
      }
    }
    if (currentAns.trim()) {
      lineBlocks.push(currentAns.trim());
    }

    if (lineBlocks.length === expectedCount) {
      return lineBlocks;
    }

    // Step 4: Use the best approximation
    // Prefer the result closest to expectedCount
    const candidates = [rawBlocks, refinedBlocks, lineBlocks];
    const best = candidates.reduce((prev, curr) =>
      Math.abs(curr.length - expectedCount) <
      Math.abs(prev.length - expectedCount)
        ? curr
        : prev,
    );

    if (best.length !== expectedCount) {
      console.warn(
        `  Warning: Expected ${expectedCount} answers, got ${best.length} blocks`,
      );
    }

    return best;
  }

  // Too many blocks — merge blocks that don't look like answer starts
  if (rawBlocks.length > expectedCount) {
    const merged = [...rawBlocks];
    while (merged.length > expectedCount) {
      // Find the best block to merge with its predecessor:
      // prefer blocks that DON'T start with an answer pattern
      let bestIdx = -1;
      let bestScore = Infinity;

      for (let i = 1; i < merged.length; i++) {
        const isAnswerStart = looksLikeAnswerStart(merged[i]);
        const combinedLen = merged[i - 1].length + merged[i].length;
        // Non-answer-starts get score 0 (merge these first), answer-starts get score 10000
        const score = (isAnswerStart ? 10000 : 0) + combinedLen;
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) bestIdx = 1;
      merged[bestIdx - 1] = merged[bestIdx - 1] + " " + merged[bestIdx];
      merged.splice(bestIdx, 1);
    }
    return merged;
  }

  return rawBlocks;
}

function splitAtAnswerBoundaries(block: string): string[] {
  // Find positions where answer-start patterns appear after a sentence ending
  const results: string[] = [];
  // Look for ". " followed by answer-start pattern
  const sentenceEndPattern = /\.\s+([A-Z])/g;
  let lastSplit = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndPattern.exec(block)) !== null) {
    const afterDot = block.substring(match.index + 2).trimStart();
    if (looksLikeAnswerStart(afterDot)) {
      const splitPos = match.index + 1; // after the period
      results.push(block.substring(lastSplit, splitPos).trim());
      lastSplit = splitPos;
    }
  }

  results.push(block.substring(lastSplit).trim());
  return results.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Combine left + right columns into question pairs
// ---------------------------------------------------------------------------

function extractAllQuestions(): ExtractedQuestion[] {
  const allQuestions: ExtractedQuestion[] = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const leftText = extractColumn(page, LEFT_CROP);
    const rightText = extractColumn(page, RIGHT_CROP);

    const questions = parseLeftColumn(leftText);
    const answers = parseRightColumn(rightText, questions.length);

    if (questions.length !== answers.length) {
      console.warn(
        `  Page ${page}: ${questions.length} questions, ${answers.length} answers — mismatch!`,
      );
    }

    const pairCount = Math.min(questions.length, answers.length);
    for (let i = 0; i < pairCount; i++) {
      const situation = cleanText(questions[i].text);
      const correctAnswer = cleanText(answers[i]);
      const source = questions[i].source;

      allQuestions.push({
        situation,
        correctAnswer,
        source,
        criteriaFull: extractCriteriaFull(correctAnswer),
        criteriaPartial: extractCriteriaPartial(correctAnswer),
      });
    }
  }

  return allQuestions;
}

// ---------------------------------------------------------------------------
// Criteria extraction from answer text
// ---------------------------------------------------------------------------

interface CriterionPattern {
  keyword: string;
  patterns: RegExp[];
  priority: number; // lower = more important
}

// NOTE: \b doesn't work reliably after ß/ü/ö/ä — these are non-word chars in JS regex.
// So we omit trailing \b for patterns ending with German special chars.
const CRITERIA_PATTERNS: CriterionPattern[] = [
  // Spielstrafen (decisions about play)
  {
    keyword: "Strafstoß",
    patterns: [/\bStrafsto(?:ß|ss)/i],
    priority: 1,
  },
  {
    keyword: "Direkter Freistoß",
    patterns: [/\bdirekte[rn]?\s+Freisto(?:ß|ss)/i],
    priority: 2,
  },
  {
    keyword: "Indirekter Freistoß",
    patterns: [/\bindirekte[rn]?\s+Freisto(?:ß|ss)/i],
    priority: 2,
  },
  {
    keyword: "Wiederholung",
    patterns: [/\bWiederholung\b/i],
    priority: 3,
  },
  {
    keyword: "Eckstoß",
    patterns: [/\bEcksto(?:ß|ss)/i],
    priority: 3,
  },
  {
    keyword: "Abstoß",
    patterns: [/\bAbsto(?:ß|ss)/i],
    priority: 3,
  },
  {
    keyword: "Einwurf",
    patterns: [/\bEinwurf\b/i],
    priority: 3,
  },
  {
    keyword: "Anstoß",
    patterns: [/\bAnsto(?:ß|ss)/i],
    priority: 4,
  },
  {
    keyword: "Weiterspielen",
    patterns: [/\bWeiterspielen\b/i, /\bweiter\s*spielen\b/i],
    priority: 2,
  },
  {
    keyword: "Schiedsrichter-Ball",
    patterns: [/\bSchiedsrichter-Ball\b/i, /\bSchiedsrichterball\b/i],
    priority: 3,
  },

  // Persönliche Strafen (personal sanctions)
  // Order matters: check Gelb/Rot BEFORE Feldverweis and Verwarnung
  {
    keyword: "Gelb/Rot",
    patterns: [/Gelb\/Rot/i, /Gelb,\s*Gelb\/Rot/i],
    priority: 2,
  },
  {
    keyword: "Feldverweis",
    patterns: [
      /\bFeldverweis\b/i,
      /\bRote[rnm]?\s+Karte\b/i,
      /\bAusschluss\b/i,
      // Match standalone „Rot" but NOT when part of „Gelb/Rot"
      /(?<!Gelb\/)(?:„Rot"|(?<!\w)Rot(?!\w)(?!.*Gelb\/Rot))/,
    ],
    priority: 1,
  },
  {
    keyword: "Verwarnung",
    patterns: [
      /\bVerwarnung\b/i,
      /\bGelbe\s+Karte\b/i,
      // Match standalone „Gelb" but not „Gelb/Rot"
      /„Gelb"(?!\/)/i,
    ],
    priority: 3,
  },

  // Tor-Entscheidungen — only match when used as an explicit decision
  {
    keyword: "Kein Tor",
    patterns: [/\bkein\s+Tor\b/i],
    priority: 2,
  },
  {
    keyword: "Tor",
    // Only match "Tor" at the start of the answer or after ", " as a decision
    patterns: [/^Tor[.,;:\s]/, /,\s*Tor[.,;:\s]/],
    priority: 2,
  },

  // Sonstige
  {
    keyword: "Spielende",
    patterns: [/\bSpielende\b/i],
    priority: 3,
  },
  {
    keyword: "Spielabbruch",
    patterns: [/\bSpielabbruch\b/i, /\bSpiel\s+abbrechen\b/i],
    priority: 2,
  },
  {
    keyword: "Spielunterbrechung",
    patterns: [/\bSpielunterbrechung\b/i],
    priority: 3,
  },

  // Ja/Nein answers (for "Handelt er richtig?" type questions)
  {
    keyword: "Ja",
    patterns: [/^Ja[.,;:\s]/],
    priority: 5,
  },
  {
    keyword: "Nein",
    patterns: [/^Nein[.,;:\s]/],
    priority: 5,
  },
];

function extractCriteriaFull(answer: string): string[] {
  const matched: { keyword: string; priority: number; position: number }[] = [];

  for (const criterion of CRITERIA_PATTERNS) {
    for (const pattern of criterion.patterns) {
      const match = answer.match(pattern);
      if (match) {
        if (!matched.some((m) => m.keyword === criterion.keyword)) {
          matched.push({
            keyword: criterion.keyword,
            priority: criterion.priority,
            position: match.index ?? 0,
          });
        }
        break;
      }
    }
  }

  // Handle conflicts:
  // "Kein Tor" present → remove standalone "Tor"
  const hasKeinTor = matched.some((m) => m.keyword === "Kein Tor");
  let filtered = hasKeinTor
    ? matched.filter((m) => m.keyword !== "Tor")
    : matched;

  // "Gelb/Rot" present → remove standalone "Feldverweis" if "Feldverweis" was
  // only matched via the „Rot" pattern (not the word "Feldverweis" itself)
  const hasGelbRot = filtered.some((m) => m.keyword === "Gelb/Rot");
  if (hasGelbRot) {
    filtered = filtered.filter((m) => {
      if (m.keyword !== "Feldverweis") return true;
      // Keep only if the actual word "Feldverweis" appears in the answer
      return /Feldverweis/i.test(answer);
    });
  }

  // Sort by position in text (order of appearance)
  return filtered.sort((a, b) => a.position - b.position).map((m) => m.keyword);
}

function extractCriteriaPartial(answer: string): string[] {
  const full = extractCriteriaFull(answer);
  if (full.length === 0) return [];

  // Return the most important criterion (lowest priority number)
  const prioritized = [...full].sort((a, b) => {
    const prioA =
      CRITERIA_PATTERNS.find((c) => c.keyword === a)?.priority ?? 99;
    const prioB =
      CRITERIA_PATTERNS.find((c) => c.keyword === b)?.priority ?? 99;
    return prioA - prioB;
  });

  return [prioritized[0]];
}

// ---------------------------------------------------------------------------
// Database import via Prisma
// ---------------------------------------------------------------------------

async function importToDatabase(questions: ExtractedQuestion[]) {
  const prisma = new PrismaClient();

  try {
    console.log(`\nImporting ${questions.length} questions to database...\n`);

    let imported = 0;
    let skipped = 0;

    for (const q of questions) {
      // Check for duplicates by matching the first 100 chars of the situation
      const existing = await prisma.regeltestQuestion.findFirst({
        where: {
          situation: {
            startsWith: q.situation.substring(0, 100),
          },
        },
      });

      if (existing) {
        console.log(`  SKIP (duplicate): "${q.situation.substring(0, 60)}..."`);
        skipped++;
        continue;
      }

      // Parse source date from source string (e.g., "SR-Zeitung 01/2025")
      const dateMatch = q.source.match(/(\d+)\/(\d+)/);
      let sourceDate: Date | undefined;
      if (dateMatch) {
        const month = parseInt(dateMatch[1], 10);
        const year = parseInt(dateMatch[2], 10);
        sourceDate = new Date(year, month - 1, 1);
      }

      await prisma.regeltestQuestion.create({
        data: {
          situation: q.situation,
          correctAnswer: q.correctAnswer,
          criteriaFull: q.criteriaFull,
          criteriaPartial: q.criteriaPartial,
          source: q.source,
          sourceDate,
          tags: [
            q.source.startsWith("SR-Newsletter") ? "Newsletter" : "Zeitung",
          ],
          isActive: true,
        },
      });

      imported++;
      console.log(`  OK: "${q.situation.substring(0, 60)}..." [${q.source}]`);
    }

    console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
  } finally {
    await prisma.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const shouldImport = args.includes("--import");

  console.log("Extracting questions from PDF (page by page)...\n");
  const questions = extractAllQuestions();

  console.log(`\nExtracted ${questions.length} questions total.\n`);

  // Show summary per source
  const sourceCounts = new Map<string, number>();
  for (const q of questions) {
    sourceCounts.set(q.source, (sourceCounts.get(q.source) ?? 0) + 1);
  }
  console.log("Questions per source:");
  for (const [source, count] of [...sourceCounts.entries()].sort()) {
    console.log(`  ${source}: ${count}`);
  }

  // Show a few samples
  console.log("\n--- Sample (first 3 questions) ---\n");
  for (const q of questions.slice(0, 3)) {
    console.log(`Source: ${q.source}`);
    console.log(`Q: ${q.situation.substring(0, 120)}...`);
    console.log(`A: ${q.correctAnswer.substring(0, 120)}...`);
    console.log(`Criteria Full: ${JSON.stringify(q.criteriaFull)}`);
    console.log(`Criteria Partial: ${JSON.stringify(q.criteriaPartial)}`);
    console.log("---");
  }

  // Save preview JSON
  const preview = questions.map((q, i) => ({
    index: i + 1,
    ...q,
  }));

  fs.writeFileSync(PREVIEW_PATH, JSON.stringify(preview, null, 2), "utf-8");
  console.log(`\nPreview saved to: ${PREVIEW_PATH}`);

  // Import to DB if --import flag is set
  if (shouldImport) {
    await importToDatabase(questions);
  } else {
    console.log(
      "\nTo import into the database, run:\n  npm run import:questions -- --import\n",
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
