import { create } from "zustand";
import type {
  RegeltestMode,
  RegeltestQuestion,
  RegeltestAnswer,
  RegeltestAnswerResult,
  RegeltestSession,
  RegeltestResults,
} from "@/types/regeltest";
import { REGELTEST_CONFIG } from "@/types/regeltest";

type Phase =
  | "idle"
  | "loading"
  | "active"
  | "submitting"
  | "evaluating"
  | "evaluating_done"
  | "results"
  | "error";

interface RegeltestState {
  phase: Phase;
  mode: RegeltestMode | null;
  sessionId: string | null;
  questions: RegeltestQuestion[];
  currentIndex: number;
  answers: Map<number, string>;
  pendingAnswer: { index: number; text: string } | null;
  timeRemaining: number;
  questionStartTime: number;
  timeSpentPerQuestion: Map<number, number>;
  results: RegeltestResults | null;
  errorMessage: string | null;
  answersSubmitted: boolean;

  startSession: (mode: RegeltestMode, tags?: string[]) => Promise<void>;
  setAnswer: (index: number, text: string) => void;
  setPendingAnswer: (index: number, text: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  tickTimer: () => void;
  handleTimeout: () => void;
  submitAllAnswers: () => Promise<void>;
  triggerEvaluation: () => Promise<void>;
  setPhase: (phase: Phase) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as Phase,
  mode: null as RegeltestMode | null,
  sessionId: null as string | null,
  questions: [] as RegeltestQuestion[],
  currentIndex: 0,
  answers: new Map<number, string>(),
  pendingAnswer: null as { index: number; text: string } | null,
  timeRemaining: 0,
  questionStartTime: 0,
  timeSpentPerQuestion: new Map<number, number>(),
  results: null as RegeltestResults | null,
  errorMessage: null as string | null,
  answersSubmitted: false,
};

export const useRegeltestStore = create<RegeltestState>((set, get) => ({
  ...initialState,

  startSession: async (mode: RegeltestMode, tags?: string[]) => {
    set({ phase: "loading", mode, errorMessage: null });

    try {
      const body: { mode: RegeltestMode; tags?: string[] } = { mode };
      if (tags && tags.length > 0) {
        body.tags = tags;
      }

      const res = await fetch("/api/regeltest/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Erstellen der Sitzung");
      }

      const session: RegeltestSession = await res.json();
      const config = REGELTEST_CONFIG[mode];

      set({
        phase: "active",
        sessionId: session.id,
        questions: session.questions,
        currentIndex: 0,
        answers: new Map(),
        timeRemaining: config.timeLimitPerQuestion ?? 0,
        questionStartTime: Date.now(),
        timeSpentPerQuestion: new Map(),
      });
    } catch (error) {
      set({
        phase: "error",
        errorMessage:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  },

  setAnswer: (index: number, text: string) => {
    const { answers } = get();
    const newAnswers = new Map(answers);
    newAnswers.set(index, text);
    set({ answers: newAnswers });
  },

  setPendingAnswer: (index: number, text: string) => {
    set({ pendingAnswer: { index, text } });
  },

  goToQuestion: (index: number) => {
    const { questions, mode, currentIndex, questionStartTime, timeSpentPerQuestion, pendingAnswer, answers } = get();
    if (index < 0 || index >= questions.length) return;

    // Flush pendingAnswer before switching questions
    let flushedAnswers = answers;
    if (pendingAnswer) {
      flushedAnswers = new Map(answers);
      flushedAnswers.set(pendingAnswer.index, pendingAnswer.text);
    }

    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    const newTimeSpent = new Map(timeSpentPerQuestion);
    newTimeSpent.set(
      currentIndex,
      (newTimeSpent.get(currentIndex) || 0) + elapsed
    );

    const config = REGELTEST_CONFIG[mode!];
    set({
      currentIndex: index,
      timeRemaining: config.timeLimitPerQuestion ?? 0,
      questionStartTime: Date.now(),
      timeSpentPerQuestion: newTimeSpent,
      answers: flushedAnswers,
      pendingAnswer: null,
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      get().goToQuestion(currentIndex + 1);
    }
  },

  previousQuestion: () => {
    const { currentIndex, mode } = get();
    if (mode === "TEST" && currentIndex > 0) {
      get().goToQuestion(currentIndex - 1);
    }
  },

  tickTimer: () => {
    const { timeRemaining, mode } = get();
    if (mode !== "EXAM") return;
    if (timeRemaining <= 1) {
      get().handleTimeout();
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  handleTimeout: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      get().goToQuestion(currentIndex + 1);
    } else {
      get().submitAllAnswers();
    }
  },

  submitAllAnswers: async () => {
    const {
      sessionId,
      questions,
      answers,
      pendingAnswer,
      currentIndex,
      questionStartTime,
      timeSpentPerQuestion,
    } = get();

    // Flush pendingAnswer before building payload
    let finalAnswers = answers;
    if (pendingAnswer) {
      finalAnswers = new Map(answers);
      finalAnswers.set(pendingAnswer.index, pendingAnswer.text);
      set({ answers: finalAnswers, pendingAnswer: null });
    }

    set({ phase: "submitting" });

    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    const finalTimeSpent = new Map(timeSpentPerQuestion);
    finalTimeSpent.set(
      currentIndex,
      (finalTimeSpent.get(currentIndex) || 0) + elapsed
    );

    const answerPayload: RegeltestAnswer[] = questions.map((q, i) => ({
      questionId: q.id,
      questionIndex: i,
      userAnswer: finalAnswers.get(i) || "",
      timeSpentSecs: finalTimeSpent.get(i) || 0,
    }));

    try {
      const res = await fetch(
        `/api/regeltest/sessions/${sessionId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answerPayload }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Einreichen der Antworten");
      }

      set({ answersSubmitted: true });
      await get().triggerEvaluation();
    } catch (error) {
      set({
        phase: "error",
        errorMessage:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  },

  triggerEvaluation: async () => {
    const { sessionId } = get();
    set({ phase: "evaluating" });

    try {
      const res = await fetch(
        `/api/regeltest/sessions/${sessionId}/evaluate`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler bei der Bewertung");
      }

      const results: RegeltestResults = await res.json();
      set({ phase: "evaluating_done", results });
    } catch (error) {
      set({
        phase: "error",
        errorMessage:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  },

  setPhase: (phase: Phase) => {
    set({ phase });
  },

  reset: () => {
    set({ ...initialState, answers: new Map(), pendingAnswer: null, timeSpentPerQuestion: new Map() });
  },
}));
