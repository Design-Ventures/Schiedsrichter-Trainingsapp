import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const statements = [
  // Enable RLS on all tables
  `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE regeltest_questions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE regeltest_sessions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE regeltest_answers ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE questions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY`,

  // users: own row only
  `CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated USING (id = auth.uid()::text)`,
  `CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid()::text)`,

  // regeltest_questions: read-only for authenticated
  `CREATE POLICY "questions_select_authenticated" ON regeltest_questions FOR SELECT TO authenticated USING (true)`,

  // regeltest_sessions: own sessions only
  `CREATE POLICY "sessions_select_own" ON regeltest_sessions FOR SELECT TO authenticated USING ("userId" = auth.uid()::text)`,
  `CREATE POLICY "sessions_insert_own" ON regeltest_sessions FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid()::text)`,
  `CREATE POLICY "sessions_update_own" ON regeltest_sessions FOR UPDATE TO authenticated USING ("userId" = auth.uid()::text)`,

  // regeltest_answers: own answers only (via session)
  `CREATE POLICY "answers_select_own" ON regeltest_answers FOR SELECT TO authenticated USING ("sessionId" IN (SELECT id FROM regeltest_sessions WHERE "userId" = auth.uid()::text))`,
  `CREATE POLICY "answers_insert_own" ON regeltest_answers FOR INSERT TO authenticated WITH CHECK ("sessionId" IN (SELECT id FROM regeltest_sessions WHERE "userId" = auth.uid()::text))`,
  `CREATE POLICY "answers_update_own" ON regeltest_answers FOR UPDATE TO authenticated USING ("sessionId" IN (SELECT id FROM regeltest_sessions WHERE "userId" = auth.uid()::text))`,

  // Quiz tables (future)
  `CREATE POLICY "mc_questions_select_authenticated" ON questions FOR SELECT TO authenticated USING (true)`,
  `CREATE POLICY "quiz_sessions_select_own" ON quiz_sessions FOR SELECT TO authenticated USING ("userId" = auth.uid()::text)`,
  `CREATE POLICY "quiz_sessions_insert_own" ON quiz_sessions FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid()::text)`,
  `CREATE POLICY "quiz_sessions_update_own" ON quiz_sessions FOR UPDATE TO authenticated USING ("userId" = auth.uid()::text)`,
  `CREATE POLICY "quiz_answers_select_own" ON quiz_answers FOR SELECT TO authenticated USING ("sessionId" IN (SELECT id FROM quiz_sessions WHERE "userId" = auth.uid()::text))`,
  `CREATE POLICY "quiz_answers_insert_own" ON quiz_answers FOR INSERT TO authenticated WITH CHECK ("sessionId" IN (SELECT id FROM quiz_sessions WHERE "userId" = auth.uid()::text))`,
];

async function main() {
  for (const sql of statements) {
    const label = sql.substring(0, 80);
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  OK: ${label}...`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("already exists")) {
        console.log(`  SKIP (exists): ${label}...`);
      } else {
        console.error(`  FAIL: ${label}...`);
        console.error(`        ${message}`);
      }
    }
  }
  console.log("\nDone!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
