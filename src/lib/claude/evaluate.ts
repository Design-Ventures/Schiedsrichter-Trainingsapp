import { anthropic } from "./client";
import {
  EVALUATION_SYSTEM_PROMPT,
  EVALUATION_FALLBACK_PROMPT,
} from "./prompts/system-evaluation";
import type { EvaluationInput, EvaluationResult } from "@/types/regeltest";

// --- Types for enriched question metadata ---

interface BewertungsElement {
  id: string;
  name: string;
  korrekte_werte: string[];
  gewicht: "pflicht" | "optional";
  synonyme: string[];
  falsche_alternativen?: Record<string, string>;
}

interface EnrichedQuestion {
  index: number;
  bewertungselemente: BewertungsElement[];
  teilpunkt_logik: {
    max_punkte: number;
    "2_punkte": string;
    "1_punkt": string;
    "0_punkte": string;
  };
  schwierigkeitsgrad: number;
  needs_review: boolean;
}

// --- Lazy-loaded enrichment data ---

let enrichedQuestionsMap: Map<number, EnrichedQuestion> | null = null;

async function getEnrichedQuestions(): Promise<
  Map<number, EnrichedQuestion>
> {
  if (enrichedQuestionsMap) return enrichedQuestionsMap;

  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const dataPath = path.join(
      process.cwd(),
      "data/evaluation/questions-enriched.json"
    );
    const data = await fs.readFile(dataPath, "utf-8");
    const questions: EnrichedQuestion[] = JSON.parse(data);

    enrichedQuestionsMap = new Map();
    for (const q of questions) {
      enrichedQuestionsMap.set(q.index, q);
    }
    return enrichedQuestionsMap;
  } catch {
    console.warn(
      "[evaluate] Could not load enriched questions – using legacy evaluation"
    );
    return new Map();
  }
}

// --- Enriched evaluation (1 question per API call) ---

function buildEnrichedPrompt(
  input: EvaluationInput,
  enriched: EnrichedQuestion
): string {
  return JSON.stringify({
    frage: {
      index: input.questionIndex,
      situation: input.situation,
      correctAnswer: input.correctAnswer,
      bewertungselemente: enriched.bewertungselemente,
      teilpunkt_logik: enriched.teilpunkt_logik,
    },
    antwort: input.userAnswer || "",
  });
}

function selectModel(schwierigkeitsgrad: number): string {
  // Hybrid approach: Haiku for standard, Sonnet for complex questions.
  // Uncomment the next line to enable Sonnet for Schwierigkeitsgrad ≥ 4:
  // if (schwierigkeitsgrad >= 4) return "claude-sonnet-4-5-20250929";
  return "claude-haiku-4-5-20251001";
}

async function evaluateSingle(
  input: EvaluationInput,
  enriched: EnrichedQuestion
): Promise<EvaluationResult> {
  const userPrompt = buildEnrichedPrompt(input, enriched);
  const model = selectModel(enriched.schwierigkeitsgrad);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1000,
        system: EVALUATION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        questionIndex: input.questionIndex,
        score: Math.min(2, Math.max(0, result.score)),
        feedback: result.feedback,
        matchedCriteria: result.matchedCriteria || [],
      };
    } catch (error) {
      if (attempt === 1) {
        return {
          questionIndex: input.questionIndex,
          score: 0,
          feedback:
            "Bewertung konnte nicht durchgeführt werden. Bitte versuche es erneut.",
          matchedCriteria: [],
        };
      }
    }
  }

  return {
    questionIndex: input.questionIndex,
    score: 0,
    feedback: "Bewertung fehlgeschlagen.",
    matchedCriteria: [],
  };
}

// --- Legacy batch evaluation (fallback for non-enriched questions) ---

const BATCH_SIZE = 15;

function buildLegacyBatchPrompt(inputs: EvaluationInput[]): string {
  const questions = inputs.map(
    (q) => `---
Frage ${q.questionIndex + 1}:
Situation: ${q.situation}
Musterantwort: ${q.correctAnswer}
Kriterien volle Punktzahl: ${q.criteriaFull.join("; ")}
Kriterien Teilpunktzahl: ${q.criteriaPartial.join("; ")}
Antwort des Prüflings: ${q.userAnswer || "(keine Antwort)"}
---`
  );

  return `Bewerte die folgenden ${inputs.length} Antworten:\n\n${questions.join("\n\n")}`;
}

async function evaluateLegacyBatch(
  inputs: EvaluationInput[]
): Promise<EvaluationResult[]> {
  const userPrompt = buildLegacyBatchPrompt(inputs);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: EVALUATION_FALLBACK_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const results: EvaluationResult[] = JSON.parse(jsonMatch[0]);

      return results.map((r) => ({
        questionIndex: r.questionIndex,
        score: Math.min(2, Math.max(0, r.score)),
        feedback: r.feedback,
        matchedCriteria: r.matchedCriteria || [],
      }));
    } catch (error) {
      if (attempt === 1) {
        return inputs.map((q) => ({
          questionIndex: q.questionIndex,
          score: 0,
          feedback:
            "Bewertung konnte nicht durchgeführt werden. Bitte versuche es erneut.",
          matchedCriteria: [],
        }));
      }
    }
  }

  return [];
}

// --- Main evaluation entry point ---

/**
 * Evaluates all answers using a hybrid strategy:
 *
 * 1. Empty answers → immediate 0 points (no API call)
 * 2. Enriched questions (126) → individual API calls with structured metadata
 *    - No cross-contamination (isolated evaluation)
 *    - Synonym recognition via explicit synonym lists
 *    - Fair partial scoring via structured elements
 *    - Fehlannahmen-Erkennung via falsche_alternativen
 * 3. Non-enriched questions (20 flagged) → legacy batch evaluation
 *
 * All calls run in parallel for minimal latency.
 */
export async function evaluateAnswers(
  inputs: EvaluationInput[]
): Promise<EvaluationResult[]> {
  // Step 1: Handle empty answers (no API call needed)
  const emptyResults: EvaluationResult[] = [];
  const toEvaluate: EvaluationInput[] = [];

  for (const input of inputs) {
    if (!input.userAnswer || input.userAnswer.trim() === "") {
      emptyResults.push({
        questionIndex: input.questionIndex,
        score: 0,
        feedback: "Keine Antwort abgegeben.",
        matchedCriteria: [],
      });
    } else {
      toEvaluate.push(input);
    }
  }

  if (toEvaluate.length === 0) {
    return emptyResults;
  }

  // Step 2: Load enriched metadata
  const enrichedMap = await getEnrichedQuestions();

  // Step 3: Route questions to enriched or legacy pipeline
  const enrichedInputs: { input: EvaluationInput; meta: EnrichedQuestion }[] =
    [];
  const legacyInputs: EvaluationInput[] = [];

  for (const input of toEvaluate) {
    // Match by questionIndex+1 (enriched data uses 1-based index field)
    const enriched = enrichedMap.get(input.questionIndex + 1);
    if (enriched && enriched.bewertungselemente.length > 0) {
      enrichedInputs.push({ input, meta: enriched });
    } else {
      legacyInputs.push(input);
    }
  }

  // Step 4: Evaluate all in parallel
  const enrichedPromises = enrichedInputs.map(({ input, meta }) =>
    evaluateSingle(input, meta)
  );

  const legacyBatches: EvaluationInput[][] = [];
  for (let i = 0; i < legacyInputs.length; i += BATCH_SIZE) {
    legacyBatches.push(legacyInputs.slice(i, i + BATCH_SIZE));
  }
  const legacyPromises = legacyBatches.map(evaluateLegacyBatch);

  const [enrichedResults, ...legacyResults] = await Promise.all([
    Promise.all(enrichedPromises),
    ...legacyPromises,
  ]);

  return [...emptyResults, ...enrichedResults, ...legacyResults.flat()];
}
