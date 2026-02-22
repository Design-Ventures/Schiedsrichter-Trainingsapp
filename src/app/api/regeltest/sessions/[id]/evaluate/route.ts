import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { evaluateAnswers } from "@/lib/claude/evaluate";
import type { EvaluationInput } from "@/types/regeltest";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id: sessionId } = await params;

    const session = await prisma.regeltestSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          orderBy: { questionIndex: "asc" },
          include: {
            question: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sitzung nicht gefunden" },
        { status: 404 }
      );
    }

    if (session.userId && session.userId !== user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    if (!session.isCompleted) {
      return NextResponse.json(
        { error: "Sitzung wurde noch nicht abgeschlossen" },
        { status: 409 }
      );
    }

    if (session.isEvaluated) {
      return NextResponse.json(
        { error: "Sitzung wurde bereits bewertet" },
        { status: 409 }
      );
    }

    const evaluationInputs: EvaluationInput[] = session.answers.map((a) => ({
      questionId: a.questionId,
      questionIndex: a.questionIndex,
      situation: a.question.situation,
      correctAnswer: a.question.correctAnswer,
      criteriaFull: a.question.criteriaFull,
      criteriaPartial: a.question.criteriaPartial,
      userAnswer: a.userAnswer,
    }));

    const results = await evaluateAnswers(evaluationInputs);

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);

    const answerUpdates = results
      .map((r) => {
        const answer = session.answers.find(
          (a) => a.questionIndex === r.questionIndex
        );
        if (!answer) return null;
        return prisma.regeltestAnswer.update({
          where: { id: answer.id },
          data: {
            score: r.score,
            aiFeedback: r.feedback,
            matchedCriteria: r.matchedCriteria,
          },
        });
      })
      .filter((op) => op !== null);

    await prisma.$transaction([
      ...answerUpdates,
      prisma.regeltestSession.update({
        where: { id: sessionId },
        data: {
          totalScore,
          isEvaluated: true,
        },
      }),
    ]);

    const resultsMap = new Map(
      results.map((r) => [r.questionIndex, r])
    );

    return NextResponse.json({
      sessionId: session.id,
      mode: session.mode,
      totalScore,
      maxScore: session.maxScore,
      totalQuestions: session.totalQuestions,
      completedAt: session.completedAt?.toISOString() ?? new Date().toISOString(),
      answers: session.answers.map((a) => {
        const result = resultsMap.get(a.questionIndex);
        return {
          questionId: a.questionId,
          questionIndex: a.questionIndex,
          userAnswer: a.userAnswer,
          score: result?.score ?? 0,
          aiFeedback: result?.feedback ?? null,
          matchedCriteria: result?.matchedCriteria ?? [],
          correctAnswer: a.question.correctAnswer,
          situation: a.question.situation,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
