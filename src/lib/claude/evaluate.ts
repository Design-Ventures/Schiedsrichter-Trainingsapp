import { anthropic } from "./client";
import type { EvaluationInput, EvaluationResult } from "@/types/regeltest";

const SYSTEM_PROMPT = `Du bist ein erfahrener DFB-Schiedsrichter-Prüfer. Du bewertest Antworten von Schiedsrichter-Anwärtern auf Regeltestfragen.

Für jede Frage erhältst du:
- Die Spielsituation
- Die korrekte Musterantwort (= die vollständige, richtige Antwort)
- Orientierungskriterien (criteriaFull / criteriaPartial) als zusätzliche Hinweise
- Die Antwort des Prüflings

BEWERTUNGSGRUNDLAGE: Vergleiche die Antwort des Prüflings PRIMÄR mit der Musterantwort. Die Orientierungskriterien helfen dir, die Kernaspekte zu erkennen, aber die Musterantwort ist die Wahrheit.

Bewertungsregeln:
- 2 Punkte: Die Antwort erfasst ALLE wesentlichen Aspekte der Musterantwort – korrekte Spielfortsetzung UND korrekte persönliche Strafe (falls relevant) UND nachvollziehbare Begründung.
- 1 Punkt: Die Antwort erfasst die Kernentscheidung (z.B. richtige Spielfortsetzung), aber die Begründung fehlt, ist unvollständig, oder eine relevante Komponente (z.B. persönliche Strafe) fehlt.
- 0 Punkte: Die Antwort ist falsch, widerspricht der Musterantwort, oder trifft keine relevante Entscheidung.

Wichtig:
- Bewerte SEMANTISCH, nicht wörtlich. Der Prüfling muss nicht exakt die gleichen Worte verwenden, aber der Inhalt muss stimmen.
- Fachbegriffe müssen korrekt verwendet werden: "Direkter Freistoß" ≠ "Indirekter Freistoß", "Verwarnung" ≠ "Feldverweis".
- Wenn die Musterantwort eine bestimmte Spielfortsetzung + persönliche Strafe nennt, müssen beide Aspekte für 2 Punkte vorhanden sein.
- Feedback auf Deutsch, max 2 Sätze. Erkläre kurz, was fehlt oder falsch ist – bezogen auf die Musterantwort.

Antworte ausschließlich im folgenden JSON-Format (als Array):
[
  {
    "questionIndex": <number>,
    "score": <0|1|2>,
    "feedback": "<kurze deutsche Begründung, max 2 Sätze>",
    "matchedCriteria": ["<liste der erfüllten Kriterien>"]
  }
]`;

function buildUserPrompt(inputs: EvaluationInput[]): string {
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

const BATCH_SIZE = 15;

async function evaluateBatch(
  inputs: EvaluationInput[]
): Promise<EvaluationResult[]> {
  const userPrompt = buildUserPrompt(inputs);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
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

export async function evaluateAnswers(
  inputs: EvaluationInput[]
): Promise<EvaluationResult[]> {
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

  const batches: EvaluationInput[][] = [];
  for (let i = 0; i < toEvaluate.length; i += BATCH_SIZE) {
    batches.push(toEvaluate.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map(evaluateBatch));
  return [...emptyResults, ...batchResults.flat()];
}
