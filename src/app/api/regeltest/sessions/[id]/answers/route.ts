import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

const submitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      questionIndex: z.number().int().min(0),
      userAnswer: z.string().max(5000),
      timeSpentSecs: z.number().int().min(0),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id: sessionId } = await params;

    const session = await prisma.regeltestSession.findUnique({
      where: { id: sessionId },
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

    if (session.isCompleted) {
      return NextResponse.json(
        { error: "Sitzung wurde bereits abgeschlossen" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = submitAnswersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Anfrage", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { answers } = parsed.data;
    const totalTimeSpent = answers.reduce((sum, a) => sum + a.timeSpentSecs, 0);

    await prisma.$transaction([
      ...answers.map((answer) =>
        prisma.regeltestAnswer.create({
          data: {
            sessionId,
            questionId: answer.questionId,
            questionIndex: answer.questionIndex,
            userAnswer: answer.userAnswer,
            timeSpentSecs: answer.timeSpentSecs,
          },
        })
      ),
      prisma.regeltestSession.update({
        where: { id: sessionId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          timeSpentSecs: totalTimeSpent,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
