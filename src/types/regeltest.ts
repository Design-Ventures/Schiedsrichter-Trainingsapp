export type RegeltestMode = "EXAM" | "TEST";

export const REGELTEST_CONFIG = {
  EXAM: {
    questionCount: 30,
    timeLimitPerQuestion: 30,
    maxScore: 60,
    label: "Prüfungsmodus",
  },
  TEST: {
    questionCount: 15,
    timeLimitPerQuestion: null,
    maxScore: 30,
    label: "Testmodus",
  },
} as const;

export interface RegeltestQuestion {
  id: string;
  situation: string;
  questionIndex: number;
}

export interface RegeltestQuestionFull extends RegeltestQuestion {
  correctAnswer: string;
  criteriaFull: string[];
  criteriaPartial: string[];
  ruleReference: string | null;
  explanation: string | null;
}

export interface RegeltestAnswer {
  questionId: string;
  questionIndex: number;
  userAnswer: string;
  timeSpentSecs: number;
}

export interface RegeltestAnswerResult {
  questionId: string;
  questionIndex: number;
  userAnswer: string;
  score: number;
  aiFeedback: string;
  matchedCriteria: string[];
  correctAnswer: string;
  situation: string;
}

export interface RegeltestSession {
  id: string;
  mode: RegeltestMode;
  totalQuestions: number;
  maxScore: number;
  questions: RegeltestQuestion[];
}

export interface RegeltestResults {
  sessionId: string;
  mode: RegeltestMode;
  totalScore: number;
  maxScore: number;
  totalQuestions: number;
  answers: RegeltestAnswerResult[];
}

export interface CreateSessionRequest {
  mode: RegeltestMode;
}

export interface SubmitAnswersRequest {
  answers: RegeltestAnswer[];
}

export interface EvaluationInput {
  questionId: string;
  questionIndex: number;
  situation: string;
  correctAnswer: string;
  criteriaFull: string[];
  criteriaPartial: string[];
  userAnswer: string;
}

export interface EvaluationResult {
  questionIndex: number;
  score: number;
  feedback: string;
  matchedCriteria: string[];
}
