#!/usr/bin/env tsx
/**
 * CLI Evaluation Test Runner
 *
 * Tests the evaluation prompt against known expected scores using Haiku.
 * Same code path as production (system prompt + enriched metadata + API call).
 *
 * Usage:
 *   npm run test:eval                          # Single run, all cases
 *   npm run test:eval -- --runs 50 --delay 2000  # 50 runs, 2s between runs
 *   npm run test:eval -- --tag rule-12         # Filter by tag
 *   npm run test:eval -- --id q3-full-correct  # Specific test case
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { pathToFileURL } from "url";

// --- Types ---

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
  situation: string;
  correctAnswer: string;
  criteriaFull: string[];
  criteriaPartial: string[];
  bewertungselemente: BewertungsElement[];
  teilpunkt_logik: {
    max_punkte: number;
    "2_punkte": string;
    "1_punkt": string;
    "0_punkte": string;
  };
  schwierigkeitsgrad: number;
}

interface TestCase {
  id: string;
  questionIndex: number;
  userAnswer: string;
  expectedScore: number;
  tags: string[];
  description: string;
}

interface BewertungElement {
  element_id: string;
  element_name: string;
  korrekt: boolean | null;
  kommentar: string;
}

interface FullEvaluationResult {
  questionIndex: number;
  score: number;
  feedback: string;
  matchedCriteria: string[];
  erkannte_fehlannahme: string | null;
  hat_aktiv_falsche_aussage: boolean;
  bewertung_elemente: BewertungElement[];
  lernhinweis?: string;
}

interface TestCaseResult {
  testCase: TestCase;
  actualScore: number;
  passed: boolean;
  fullResponse: FullEvaluationResult | null;
  error?: string;
  durationMs: number;
}

interface RunReport {
  timestamp: string;
  model: string;
  promptVersion: string;
  totalCases: number;
  passed: number;
  failed: number;
  accuracy: number;
  results: TestCaseResult[];
  confusionMatrix: number[][];
  durationMs: number;
}

// --- Constants ---

const MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "v2.1";
const MAX_TOKENS = 1000;
const CALL_DELAY_MS = 200;

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const RESULTS_DIR = path.join(DATA_DIR, "evaluation", "test-results");

// --- CLI Args ---

function parseArgs(): {
  runs: number;
  delay: number;
  tag?: string;
  id?: string;
} {
  const args = process.argv.slice(2);
  let runs = 1;
  let delay = 0;
  let tag: string | undefined;
  let id: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--runs":
        runs = parseInt(args[++i], 10);
        break;
      case "--delay":
        delay = parseInt(args[++i], 10);
        break;
      case "--tag":
        tag = args[++i];
        break;
      case "--id":
        id = args[++i];
        break;
    }
  }

  return { runs, delay, tag, id };
}

// --- Data Loading ---

async function loadSystemPrompt(): Promise<string> {
  const promptPath = path.join(
    ROOT,
    "src/lib/claude/prompts/system-evaluation.ts"
  );
  const promptModule = await import(pathToFileURL(promptPath).href);
  // tsx wraps CJS-style exports under .default
  const exports = promptModule.default || promptModule;
  return exports.EVALUATION_SYSTEM_PROMPT;
}

async function loadEnrichedQuestions(): Promise<Map<number, EnrichedQuestion>> {
  const dataPath = path.join(DATA_DIR, "evaluation", "questions-enriched.json");
  const data = await fs.readFile(dataPath, "utf-8");
  const questions: EnrichedQuestion[] = JSON.parse(data);
  const map = new Map<number, EnrichedQuestion>();
  for (const q of questions) {
    map.set(q.index, q);
  }
  return map;
}

async function loadTestCases(): Promise<TestCase[]> {
  const dataPath = path.join(DATA_DIR, "evaluation", "test-cases.json");
  const data = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(data);
}

// --- Prompt Building (mirrors evaluate.ts buildEnrichedPrompt) ---

function buildUserPrompt(
  question: EnrichedQuestion,
  userAnswer: string
): string {
  return JSON.stringify({
    frage: {
      index: question.index,
      situation: question.situation,
      correctAnswer: question.correctAnswer,
      bewertungselemente: question.bewertungselemente,
      teilpunkt_logik: question.teilpunkt_logik,
    },
    antwort: userAnswer || "",
  });
}

// --- JSON repair for malformed LLM output ---

/**
 * State-machine JSON repair: walks char-by-char, tracks whether we're inside
 * a JSON string, and escapes any ASCII " (U+0022) that appears at a
 * non-structural position (i.e. content quote, not a key/value delimiter).
 */
function repairJson(raw: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    if (ch === "\\" && inString && i + 1 < raw.length) {
      result.push(ch, raw[i + 1]);
      i += 2;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        result.push(ch);
      } else {
        let j = i + 1;
        while (j < raw.length && /\s/.test(raw[j])) j++;
        const next = j < raw.length ? raw[j] : "";

        if (
          next === ":" ||
          next === "," ||
          next === "}" ||
          next === "]" ||
          next === '"' ||
          next === ""
        ) {
          inString = false;
          result.push(ch);
        } else {
          result.push('\\"');
        }
      }
    } else {
      result.push(ch);
    }

    i++;
  }

  return result.join("");
}

function safeJsonParse<T>(raw: string): T {
  try {
    return JSON.parse(raw);
  } catch {
    const repaired = repairJson(raw);
    return JSON.parse(repaired);
  }
}

// --- API Call ---

async function evaluateTestCase(
  client: Anthropic,
  systemPrompt: string,
  question: EnrichedQuestion,
  testCase: TestCase
): Promise<TestCaseResult> {
  const start = Date.now();

  // Empty answer: immediate 0P, no API call (same as production)
  if (!testCase.userAnswer || testCase.userAnswer.trim() === "") {
    return {
      testCase,
      actualScore: 0,
      passed: testCase.expectedScore === 0,
      fullResponse: {
        questionIndex: testCase.questionIndex,
        score: 0,
        feedback: "Keine Antwort abgegeben.",
        matchedCriteria: [],
        erkannte_fehlannahme: null,
        hat_aktiv_falsche_aussage: false,
        bewertung_elemente: [],
      },
      durationMs: Date.now() - start,
    };
  }

  const userPrompt = buildUserPrompt(question, testCase.userAnswer);

  // Retry logic matching production (2 attempts)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error(`No JSON in response: ${text.slice(0, 200)}`);
      }

      const result: FullEvaluationResult = safeJsonParse(jsonMatch[0]);
      const actualScore = Math.min(2, Math.max(0, result.score));

      return {
        testCase,
        actualScore,
        passed: actualScore === testCase.expectedScore,
        fullResponse: { ...result, score: actualScore },
        durationMs: Date.now() - start,
      };
    } catch (error) {
      if (attempt === 1) {
        return {
          testCase,
          actualScore: -1,
          passed: false,
          fullResponse: null,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        };
      }
      // Brief pause before retry
      await sleep(500);
    }
  }

  // Unreachable, but satisfies TypeScript
  return {
    testCase,
    actualScore: -1,
    passed: false,
    fullResponse: null,
    error: "Unexpected: all retries exhausted",
    durationMs: Date.now() - start,
  };
}

// --- Confusion Matrix ---

function buildConfusionMatrix(results: TestCaseResult[]): number[][] {
  // 3x3 matrix: actual (rows) vs expected (columns), scores 0-2
  const matrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const r of results) {
    if (r.actualScore >= 0 && r.actualScore <= 2) {
      matrix[r.actualScore][r.testCase.expectedScore]++;
    }
  }
  return matrix;
}

// --- Reporting ---

function printRunReport(report: RunReport, runNumber?: number): void {
  const header = runNumber
    ? `Run ${runNumber} — ${report.timestamp}`
    : report.timestamp;

  console.log(`\n${"═".repeat(60)}`);
  console.log(` Evaluation Test Run ${header}`);
  console.log(`${"═".repeat(60)}`);
  console.log(
    `Model: ${report.model} | Prompt: ${report.promptVersion} | Cases: ${report.totalCases}`
  );
  console.log(
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s\n`
  );

  const pct = (report.accuracy * 100).toFixed(1);
  console.log(
    `Results: ${report.passed}/${report.totalCases} correct (${pct}%)\n`
  );

  // Confusion matrix
  const m = report.confusionMatrix;
  console.log("Confusion Matrix (rows=actual, cols=expected):");
  console.log("             Expected 0  Expected 1  Expected 2");
  for (let row = 0; row < 3; row++) {
    const cells = m[row]
      .map((v, col) => {
        const s = row === col ? `[${v}]` : ` ${v} `;
        return s.padStart(10);
      })
      .join("  ");
    console.log(`  Actual ${row}  ${cells}`);
  }

  // Failures
  const failures = report.results.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log(`\nFAILURES:`);
    for (const f of failures) {
      if (f.error) {
        console.log(
          `  ✗ ${f.testCase.id}: ERROR — ${f.error}`
        );
      } else {
        console.log(
          `  ✗ ${f.testCase.id}: expected ${f.testCase.expectedScore}, got ${f.actualScore}`
        );
        console.log(
          `    Answer: "${f.testCase.userAnswer}"`
        );
        if (f.fullResponse) {
          console.log(
            `    AI feedback: "${f.fullResponse.feedback}"`
          );
          if (f.fullResponse.hat_aktiv_falsche_aussage) {
            console.log(
              `    → aktiv_falsche_aussage = true`
            );
          }
          if (f.fullResponse.bewertung_elemente?.length) {
            for (const el of f.fullResponse.bewertung_elemente) {
              const status =
                el.korrekt === true
                  ? "✓"
                  : el.korrekt === false
                    ? "✗"
                    : "—";
              console.log(
                `    ${status} ${el.element_id}: ${el.kommentar}`
              );
            }
          }
        }
      }
    }
  } else {
    console.log("\nAll cases passed!");
  }
}

function printOvernightSummary(
  reports: RunReport[],
  allResults: Map<string, boolean[]>
): void {
  console.log(`\n${"═".repeat(60)}`);
  console.log(` Overnight Summary (${reports.length} runs)`);
  console.log(`${"═".repeat(60)}`);

  const accuracies = reports.map((r) => r.accuracy);
  const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const variance =
    accuracies.reduce((sum, a) => sum + (a - avg) ** 2, 0) /
    accuracies.length;
  const stddev = Math.sqrt(variance);

  console.log(
    `Overall accuracy: ${(avg * 100).toFixed(1)}% (avg), σ=${(stddev * 100).toFixed(1)}%`
  );
  console.log(`\nPer-case stability:`);

  // Sort by stability (worst first)
  const entries = [...allResults.entries()].sort((a, b) => {
    const aRate = a[1].filter(Boolean).length / a[1].length;
    const bRate = b[1].filter(Boolean).length / b[1].length;
    return aRate - bRate;
  });

  for (const [id, passes] of entries) {
    const passCount = passes.filter(Boolean).length;
    const total = passes.length;
    const pct = ((passCount / total) * 100).toFixed(0);
    const status =
      passCount === total
        ? "stable ✓"
        : passCount / total >= 0.9
          ? "mostly stable"
          : "flaky ⚠";
    console.log(
      `  ${id.padEnd(35)} ${passCount}/${total} (${pct.padStart(3)}%) — ${status}`
    );
  }
}

// --- Save Results ---

async function saveReport(report: RunReport): Promise<string> {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  const filename = `eval-${report.timestamp.replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(RESULTS_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

// --- Sleep Utility ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---

async function main(): Promise<void> {
  const { runs, delay, tag, id } = parseArgs();

  console.log("Loading data...");

  const [systemPrompt, enrichedMap, allTestCases] = await Promise.all([
    loadSystemPrompt(),
    loadEnrichedQuestions(),
    loadTestCases(),
  ]);

  // Filter test cases
  let testCases = allTestCases;
  if (id) {
    testCases = testCases.filter((tc) => tc.id === id);
    if (testCases.length === 0) {
      console.error(`No test case found with id: ${id}`);
      process.exit(1);
    }
  }
  if (tag) {
    testCases = testCases.filter((tc) => tc.tags.includes(tag));
    if (testCases.length === 0) {
      console.error(`No test cases found with tag: ${tag}`);
      process.exit(1);
    }
  }

  // Validate all test cases have enriched data
  for (const tc of testCases) {
    if (!enrichedMap.has(tc.questionIndex)) {
      console.error(
        `No enriched data for questionIndex ${tc.questionIndex} (test case: ${tc.id})`
      );
      process.exit(1);
    }
  }

  const client = new Anthropic();

  console.log(
    `Running ${runs} run(s) with ${testCases.length} test case(s)...`
  );
  if (tag) console.log(`  Filter: tag=${tag}`);
  if (id) console.log(`  Filter: id=${id}`);

  const reports: RunReport[] = [];
  const allResults = new Map<string, boolean[]>();

  // Initialize per-case tracking
  for (const tc of testCases) {
    allResults.set(tc.id, []);
  }

  for (let run = 0; run < runs; run++) {
    if (run > 0 && delay > 0) {
      console.log(`\nWaiting ${delay}ms before next run...`);
      await sleep(delay);
    }

    const runStart = Date.now();
    const results: TestCaseResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const enriched = enrichedMap.get(tc.questionIndex)!;

      const result = await evaluateTestCase(
        client,
        systemPrompt,
        enriched,
        tc
      );
      results.push(result);

      allResults.get(tc.id)!.push(result.passed);

      // Progress indicator
      const icon = result.passed ? "✓" : "✗";
      process.stdout.write(icon);

      // Rate limit delay (skip for empty answers which don't call API)
      if (tc.userAnswer.trim() !== "" && i < testCases.length - 1) {
        await sleep(CALL_DELAY_MS);
      }
    }

    process.stdout.write("\n");

    const passed = results.filter((r) => r.passed).length;
    const report: RunReport = {
      timestamp: new Date().toISOString(),
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      totalCases: testCases.length,
      passed,
      failed: testCases.length - passed,
      accuracy: passed / testCases.length,
      results,
      confusionMatrix: buildConfusionMatrix(results),
      durationMs: Date.now() - runStart,
    };

    reports.push(report);
    printRunReport(report, runs > 1 ? run + 1 : undefined);

    const savedPath = await saveReport(report);
    console.log(`\nReport saved: ${path.relative(ROOT, savedPath)}`);
  }

  // Overnight summary for multiple runs
  if (runs > 1) {
    printOvernightSummary(reports, allResults);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
