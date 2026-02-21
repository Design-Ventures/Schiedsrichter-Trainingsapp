import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ALL_QUESTIONS_PATH = path.resolve("data/questions-all.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppQuestion {
  index: number;
  situation: string;
  correctAnswer: string;
  source: string;
  criteriaFull: string[];
  criteriaPartial: string[];
  sourceDate: string;
  ruleReference: string;
  tags: string[];
  explanation: string;
}

// ---------------------------------------------------------------------------
// Database import via Prisma
// ---------------------------------------------------------------------------

async function importToDatabase(questions: AppQuestion[], replace = false) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
    },
  });

  try {
    if (replace) {
      await prisma.$executeRaw`DELETE FROM "regeltest_answers"`;
      await prisma.$executeRaw`DELETE FROM "regeltest_sessions"`;
      await prisma.$executeRaw`DELETE FROM "regeltest_questions"`;
      console.log(`\nDeleted all existing questions, sessions, and answers from database.`);
    }

    console.log(`\nImporting ${questions.length} questions to database...\n`);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const q of questions) {
      // Check for duplicates by matching the first 100 chars of the situation
      const existing = await prisma.regeltestQuestion.findFirst({
        where: {
          situation: {
            startsWith: q.situation.substring(0, 100),
          },
        },
      });

      if (existing) {
        if (args.includes("--update")) {
          // Update existing question with new data
          await prisma.regeltestQuestion.update({
            where: { id: existing.id },
            data: {
              correctAnswer: q.correctAnswer,
              criteriaFull: q.criteriaFull,
              criteriaPartial: q.criteriaPartial,
              ruleReference: q.ruleReference || undefined,
              tags: q.tags,
              explanation: q.explanation || undefined,
              source: q.source,
              sourceDate: q.sourceDate ? new Date(q.sourceDate) : undefined,
            },
          });
          updated++;
          console.log(`  UPDATE: "${q.situation.substring(0, 50)}..." [${q.source}]`);
        } else {
          skipped++;
        }
        continue;
      }

      // Parse source date
      let sourceDate: Date | undefined;
      if (q.sourceDate) {
        sourceDate = new Date(q.sourceDate);
      }

      await prisma.regeltestQuestion.create({
        data: {
          situation: q.situation,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || undefined,
          criteriaFull: q.criteriaFull,
          criteriaPartial: q.criteriaPartial,
          ruleReference: q.ruleReference || undefined,
          source: q.source,
          sourceDate,
          tags: q.tags,
          isActive: true,
        },
      });

      imported++;
      console.log(`  OK: "${q.situation.substring(0, 50)}..." [${q.source}]`);
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Done!`);
    console.log(`  Imported: ${imported}`);
    console.log(`  Updated:  ${updated}`);
    console.log(`  Skipped:  ${skipped} (duplicates)`);
    console.log(`  Total:    ${questions.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

async function main() {
  const shouldImport = args.includes("--import");
  const shouldUpdate = args.includes("--update");
  const shouldReplace = args.includes("--replace");

  // Load questions from JSON
  if (!fs.existsSync(ALL_QUESTIONS_PATH)) {
    console.error(`Error: ${ALL_QUESTIONS_PATH} not found!`);
    console.error("Run the conversion script first to generate this file.");
    process.exit(1);
  }

  const questions: AppQuestion[] = JSON.parse(
    fs.readFileSync(ALL_QUESTIONS_PATH, "utf-8"),
  );

  console.log(`Loaded ${questions.length} questions from ${ALL_QUESTIONS_PATH}`);

  // Show summary per source
  const sourceCounts = new Map<string, number>();
  for (const q of questions) {
    sourceCounts.set(q.source, (sourceCounts.get(q.source) ?? 0) + 1);
  }
  console.log("\nQuestions per source:");
  for (const [source, count] of [...sourceCounts.entries()].sort()) {
    console.log(`  ${source}: ${count}`);
  }

  // Criteria stats
  const withCriteria = questions.filter((q) => q.criteriaFull.length > 0).length;
  console.log(
    `\nWith criteria: ${withCriteria}/${questions.length} (${((withCriteria / questions.length) * 100).toFixed(1)}%)`,
  );

  // Show sample
  console.log("\n--- Sample (first 3) ---\n");
  for (const q of questions.slice(0, 3)) {
    console.log(`[${q.source}] ${q.situation.substring(0, 80)}...`);
    console.log(`  → ${q.correctAnswer.substring(0, 80)}...`);
    console.log(`  Criteria: ${JSON.stringify(q.criteriaFull)}`);
    console.log(`  Tags: ${JSON.stringify(q.tags)}`);
    console.log();
  }

  if (shouldReplace) {
    await importToDatabase(questions, true);
  } else if (shouldImport || shouldUpdate) {
    await importToDatabase(questions);
  } else {
    console.log(
      "\nTo import into the database, run:" +
        "\n  npm run import:all -- --import" +
        "\n\nTo update existing + import new:" +
        "\n  npm run import:all -- --import --update" +
        "\n\nTo delete all and reimport fresh:" +
        "\n  npm run import:all -- --replace\n",
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
