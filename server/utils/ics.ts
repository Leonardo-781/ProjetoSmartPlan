import { type Reminder } from "@shared/schema";

/**
 * Generate an ICS (iCalendar) file content from a reminder
 */
export function generateICS(reminder: Reminder): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(reminder.dueAt);
  
  // Calculate alarm time (reminder notification)
  const alarmMinutes = -Math.abs(reminder.remindBeforeMinutes);
  
  // Determine recurrence rule if applicable
  let rrule = "";
  if (reminder.repeat !== "none") {
    const freq = reminder.repeat.toUpperCase();
    rrule = `RRULE:FREQ=${freq}\r\n`;
  }
  
  // Clean and escape text for ICS format
  const escapeICSText = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };
  
  const summary = escapeICSText(reminder.title);
  const description = escapeICSText(reminder.description);
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartPlan UFU//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:reminder-${reminder.id}@smartplan.ufu`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    `STATUS:CONFIRMED`,
    `TRANSP:OPAQUE`,
    rrule,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `TRIGGER:-PT${Math.abs(alarmMinutes)}M`,
    `DESCRIPTION:Reminder: ${summary}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  
  return icsContent;
}

/**
 * Format a Date object to ICS datetime format (YYYYMMDDTHHMMSSZ)
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
