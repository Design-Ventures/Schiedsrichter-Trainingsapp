import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { REGELTEST_CONFIG } from "@/types/regeltest";

const createSessionSchema = z.object({
  mode: z.enum(["EXAM", "TEST"]),
  tags: z.array(z.string()).optional(),
});

function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Anfrage", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mode, tags } = parsed.data;
    const config = REGELTEST_CONFIG[mode];
    const isFiltered = tags && tags.length > 0;

    const whereClause: { isActive: true; tags?: { hasSome: string[] } } = {
      isActive: true,
    };
    if (isFiltered) {
      whereClause.tags = { hasSome: tags };
    }

    const allQuestionIds = await prisma.regeltestQuestion.findMany({
      where: whereClause,
      select: { id: true },
    });

    const minRequired = isFiltered ? 5 : config.questionCount;
    if (allQuestionIds.length < minRequired) {
      return NextResponse.json(
        {
          error: `Nicht genügend Fragen verfügbar (${allQuestionIds.length}/${minRequired})`,
        },
        { status: 422 }
      );
    }

    const questionCount = isFiltered
      ? Math.min(config.questionCount, allQuestionIds.length)
      : config.questionCount;

    const shuffled = fisherYatesShuffle(allQuestionIds);
    const selectedIds = shuffled.slice(0, questionCount).map((q) => q.id);

    const questions = await prisma.regeltestQuestion.findMany({
      where: { id: { in: selectedIds } },
      select: { id: true, situation: true },
    });

    const orderedQuestions = selectedIds.map((id, index) => {
      const q = questions.find((q) => q.id === id)!;
      return { id: q.id, situation: q.situation, questionIndex: index };
    });

    const session = await prisma.regeltestSession.create({
      data: {
        userId: user?.id ?? null,
        mode,
        totalQuestions: questionCount,
        maxScore: questionCount * 2,
      },
    });

    return NextResponse.json({
      id: session.id,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      maxScore: session.maxScore,
      questions: orderedQuestions,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
