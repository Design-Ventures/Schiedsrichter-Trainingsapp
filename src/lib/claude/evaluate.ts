import { anthropic } from "./client";
import type { EvaluationInput, EvaluationResult } from "@/types/regeltest";

const SYSTEM_PROMPT = `Du bist ein erfahrener DFB-Schiedsrichter-Prüfer. Du bewertest Antworten von Schiedsrichter-Anwärtern auf Regeltestfragen.

Für jede Frage erhältst du:
- Die Spielsituation
- Die korrekte Musterantwort
- Kriterien für volle Punktzahl (criteriaFull) und Teilpunktzahl (criteriaPartial)
- Die Antwort des Prüflings

Bewertungsregeln:
- 2 Punkte: ALLE criteriaFull sind in der Antwort sinngemäß enthalten
- 1 Punkt: Mindestens eines der criteriaPartial ist sinngemäß enthalten, aber nicht alle criteriaFull
- 0 Punkte: Keines der Kriterien ist erkennbar enthalten, oder die Antwort ist leer/unsinnig

Wichtig:
- Bewerte sinngemäß, nicht wörtlich. Der Prüfling muss nicht exakt die gleichen Worte verwenden.
- Fachbegriffe (z.B. "Direkter Freistoß", "Persönliche Strafe", "Vorteil") müssen korrekt verwendet werden.
- Eine leere oder offensichtlich falsche Antwort erhält immer 0 Punkte.

Antworte ausschließlich im folgenden JSON-Format (als Array):
[
  {
    "questionIndex": <number>,
    "score": <0|1|2>,
    "feedback": "<kurze deutsche Begründung der Bewertung, max 2 Sätze>",
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

const BATCH_SIZE = 8;

async function evaluateBatch(
  inputs: EvaluationInput[]
): Promise<EvaluationResult[]> {
  const userPrompt = buildUserPrompt(inputs);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
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
  const batches: EvaluationInput[][] = [];
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    batches.push(inputs.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map(evaluateBatch));
  return batchResults.flat();
}
