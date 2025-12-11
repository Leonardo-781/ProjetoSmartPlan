-- Migration: Add reminders and reminder_notifications tables
-- Date: 2025-12-11

-- Create reminders table
CREATE TABLE IF NOT EXISTS "reminders" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "remind_before_minutes" INTEGER NOT NULL DEFAULT 0,
  "repeat" VARCHAR(20) NOT NULL DEFAULT 'none',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create reminder_notifications table
CREATE TABLE IF NOT EXISTS "reminder_notifications" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "reminder_id" VARCHAR NOT NULL REFERENCES "reminders"("id") ON DELETE CASCADE,
  "notified_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_reminders_user_id" ON "reminders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_due_at" ON "reminders"("due_at");
CREATE INDEX IF NOT EXISTS "idx_reminders_type" ON "reminders"("type");
CREATE INDEX IF NOT EXISTS "idx_reminder_notifications_reminder_id" ON "reminder_notifications"("reminder_id");
CREATE INDEX IF NOT EXISTS "idx_reminder_notifications_notified_at" ON "reminder_notifications"("notified_at");
