-- Create reminders table
CREATE TABLE IF NOT EXISTS "reminders" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "due_at" timestamp NOT NULL,
  "remind_before_minutes" integer NOT NULL DEFAULT 30,
  "repeat" varchar(20) NOT NULL DEFAULT 'none',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create reminder_notifications table
CREATE TABLE IF NOT EXISTS "reminder_notifications" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "reminder_id" varchar NOT NULL REFERENCES "reminders"("id") ON DELETE CASCADE,
  "notified_at" timestamp DEFAULT now(),
  "status" varchar(20) NOT NULL DEFAULT 'sent'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_reminders_user_id" ON "reminders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_due_at" ON "reminders"("due_at");
CREATE INDEX IF NOT EXISTS "idx_reminders_type" ON "reminders"("type");
CREATE INDEX IF NOT EXISTS "idx_reminder_notifications_reminder_id" ON "reminder_notifications"("reminder_id");
