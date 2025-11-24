-- Enable Row Level Security on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "columns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_recommendations" ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON "users"
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON "users"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Projects table policies
CREATE POLICY "Users can view own projects"
  ON "projects"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own projects"
  ON "projects"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own projects"
  ON "projects"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own projects"
  ON "projects"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- Milestones table policies
CREATE POLICY "Users can view milestones of own projects"
  ON "milestones"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects".id = "milestones"."projectId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create milestones in own projects"
  ON "milestones"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects".id = "milestones"."projectId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update milestones in own projects"
  ON "milestones"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects".id = "milestones"."projectId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete milestones from own projects"
  ON "milestones"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects".id = "milestones"."projectId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

-- Tasks table policies
CREATE POLICY "Users can view tasks of own milestones"
  ON "tasks"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "milestones"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "milestones".id = "tasks"."milestoneId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create tasks in own milestones"
  ON "tasks"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "milestones"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "milestones".id = "tasks"."milestoneId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update tasks in own milestones"
  ON "tasks"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "milestones"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "milestones".id = "tasks"."milestoneId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete tasks from own milestones"
  ON "tasks"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "milestones"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "milestones".id = "tasks"."milestoneId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

-- Columns table policies
CREATE POLICY "Users can view own columns"
  ON "columns"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own columns"
  ON "columns"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own columns"
  ON "columns"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own columns"
  ON "columns"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- Tags table policies
CREATE POLICY "Users can view own tags"
  ON "tags"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own tags"
  ON "tags"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own tags"
  ON "tags"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own tags"
  ON "tags"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- Task Tags table policies
CREATE POLICY "Users can view task tags of own tasks"
  ON "task_tags"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "tasks"
      JOIN "milestones" ON "milestones".id = "tasks"."milestoneId"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "tasks".id = "task_tags"."taskId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create task tags for own tasks"
  ON "task_tags"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "tasks"
      JOIN "milestones" ON "milestones".id = "tasks"."milestoneId"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "tasks".id = "task_tags"."taskId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete task tags from own tasks"
  ON "task_tags"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "tasks"
      JOIN "milestones" ON "milestones".id = "tasks"."milestoneId"
      JOIN "projects" ON "projects".id = "milestones"."projectId"
      WHERE "tasks".id = "task_tags"."taskId"
      AND "projects"."userId" = auth.uid()::text
    )
  );

-- AI Recommendations table policies
CREATE POLICY "Users can view own AI recommendations"
  ON "ai_recommendations"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own AI recommendations"
  ON "ai_recommendations"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own AI recommendations"
  ON "ai_recommendations"
  FOR DELETE
  USING (auth.uid()::text = "userId");
