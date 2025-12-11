import type { Reminder } from "@shared/schema";

/**
 * Formats a date to iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Converts repeat pattern to iCalendar RRULE
 */
function getRecurrenceRule(repeat: string): string {
  switch (repeat) {
    case "daily":
      return "RRULE:FREQ=DAILY";
    case "weekly":
      return "RRULE:FREQ=WEEKLY";
    case "monthly":
      return "RRULE:FREQ=MONTHLY";
    default:
      return "";
  }
}

/**
 * Escapes special characters for iCalendar text fields
 */
function escapeICSText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates an iCalendar (.ics) file content for a reminder
 */
export function generateICS(reminder: Reminder): string {
  const now = new Date();
  const dueAt = new Date(reminder.dueAt);
  const startTime = new Date(dueAt.getTime() - reminder.remindBeforeMinutes * 60 * 1000);
  
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProjetoSmartPlan//Reminders//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${reminder.id}@projetosmartplan`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(dueAt)}`,
    `SUMMARY:${escapeICSText(reminder.title)}`,
  ];

  if (reminder.description) {
    lines.push(`DESCRIPTION:${escapeICSText(reminder.description)}`);
  }

  // Add alarm/reminder
  lines.push("BEGIN:VALARM");
  lines.push("ACTION:DISPLAY");
  lines.push(`DESCRIPTION:${escapeICSText(reminder.title)}`);
  lines.push(`TRIGGER:-PT${reminder.remindBeforeMinutes}M`);
  lines.push("END:VALARM");

  // Add recurrence rule if applicable
  const rrule = getRecurrenceRule(reminder.repeat);
  if (rrule) {
    lines.push(rrule);
  }

  // Add category based on type
  const category = reminder.type === "exam_assignment" ? "Exam/Assignment" : "Work Meeting";
  lines.push(`CATEGORIES:${category}`);

  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
