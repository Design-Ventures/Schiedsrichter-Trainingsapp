import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.regeltestSession.findUnique({
      where: { id },
      include: {
        answers: {
          orderBy: { questionIndex: "asc" },
          include: {
            question: {
              select: {
                id: true,
                situation: true,
                correctAnswer: true,
              },
            },
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

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    if (!session.isEvaluated) {
      return NextResponse.json({
        id: session.id,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        maxScore: session.maxScore,
        isCompleted: session.isCompleted,
        isEvaluated: session.isEvaluated,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      mode: session.mode,
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      totalQuestions: session.totalQuestions,
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        questionIndex: a.questionIndex,
        userAnswer: a.userAnswer,
        score: a.score,
        aiFeedback: a.aiFeedback,
        matchedCriteria: a.matchedCriteria,
        correctAnswer: a.question.correctAnswer,
        situation: a.question.situation,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
