import type { Reminder } from "@shared/schema";

/**
 * Formats a Date object to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

const REPEAT_FREQUENCY_MAP: Record<string, string> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
};

/**
 * Generates an ICS (iCalendar) file content for a reminder
 */
export function generateICS(reminder: Reminder): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(reminder.dueAt);
  const uid = `${reminder.id}@smartplan`;
  
  const title = escapeICSText(reminder.title);
  const description = reminder.description ? escapeICSText(reminder.description) : "";
  
  // Calculate alarm time (remind_before_minutes before due_at)
  const alarmMinutes = reminder.remindBeforeMinutes || 30;
  
  let rrule = "";
  if (reminder.repeat !== "none") {
    const freq = REPEAT_FREQUENCY_MAP[reminder.repeat] || reminder.repeat.toUpperCase();
    rrule = `RRULE:FREQ=${freq}\r\n`;
  }
  
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartPlan//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `SUMMARY:${title}`,
  ];
  
  if (description) {
    icsLines.push(`DESCRIPTION:${description}`);
  }
  
  if (rrule) {
    icsLines.push(rrule.trim());
  }
  
  // Add alarm/reminder
  icsLines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${title}`,
    `TRIGGER:-PT${alarmMinutes}M`,
    "END:VALARM"
  );
  
  icsLines.push("END:VEVENT", "END:VCALENDAR");
  
  return icsLines.join("\r\n") + "\r\n";
}
