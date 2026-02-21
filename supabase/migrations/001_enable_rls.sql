-- ============================================
-- Enable Row Level Security on all tables
-- ============================================
-- This ensures the Supabase anon key cannot access
-- any data unless explicitly allowed by a policy.
-- Prisma (server-side, using DATABASE_URL) connects
-- as the postgres role which bypasses RLS, so server
-- API routes are unaffected.

-- Enable RLS (blocks all access by default for anon/authenticated roles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regeltest_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regeltest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regeltest_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- users: own row only
-- ============================================
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid())::text);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid())::text);

-- ============================================
-- regeltest_questions: read-only for authenticated
-- ============================================
-- Users need to read questions during tests.
-- Only situation is exposed client-side (API filters fields),
-- but even if accessed directly, answers are just reference text.
CREATE POLICY "questions_select_authenticated"
  ON regeltest_questions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- regeltest_sessions: own sessions only
-- ============================================
CREATE POLICY "sessions_select_own"
  ON regeltest_sessions FOR SELECT
  TO authenticated
  USING ("userId" = (select auth.uid())::text);

CREATE POLICY "sessions_insert_own"
  ON regeltest_sessions FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "sessions_update_own"
  ON regeltest_sessions FOR UPDATE
  TO authenticated
  USING ("userId" = (select auth.uid())::text);

-- ============================================
-- regeltest_answers: own answers only (via session ownership)
-- ============================================
CREATE POLICY "answers_select_own"
  ON regeltest_answers FOR SELECT
  TO authenticated
  USING (
    "sessionId" IN (
      SELECT id FROM regeltest_sessions WHERE "userId" = (select auth.uid())::text
    )
  );

CREATE POLICY "answers_insert_own"
  ON regeltest_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    "sessionId" IN (
      SELECT id FROM regeltest_sessions WHERE "userId" = (select auth.uid())::text
    )
  );

CREATE POLICY "answers_update_own"
  ON regeltest_answers FOR UPDATE
  TO authenticated
  USING (
    "sessionId" IN (
      SELECT id FROM regeltest_sessions WHERE "userId" = (select auth.uid())::text
    )
  );

-- ============================================
-- Quiz tables (future): same pattern
-- ============================================
CREATE POLICY "mc_questions_select_authenticated"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "quiz_sessions_select_own"
  ON quiz_sessions FOR SELECT
  TO authenticated
  USING ("userId" = (select auth.uid())::text);

CREATE POLICY "quiz_sessions_insert_own"
  ON quiz_sessions FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = (select auth.uid())::text);

CREATE POLICY "quiz_sessions_update_own"
  ON quiz_sessions FOR UPDATE
  TO authenticated
  USING ("userId" = (select auth.uid())::text);

CREATE POLICY "quiz_answers_select_own"
  ON quiz_answers FOR SELECT
  TO authenticated
  USING (
    "sessionId" IN (
      SELECT id FROM quiz_sessions WHERE "userId" = (select auth.uid())::text
    )
  );

CREATE POLICY "quiz_answers_insert_own"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    "sessionId" IN (
      SELECT id FROM quiz_sessions WHERE "userId" = (select auth.uid())::text
    )
  );
