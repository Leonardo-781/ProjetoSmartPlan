import type { Reminder } from "@shared/schema";

/**
 * Generate an iCalendar (.ics) file content for a reminder
 */
export function generateICS(reminder: Reminder): string {
  const now = new Date();
  const dueAt = new Date(reminder.dueAt);
  
  // Format dates in iCalendar format (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Calculate reminder time
  const remindAt = new Date(dueAt.getTime() - reminder.remindBeforeMinutes * 60000);
  
  // Build VEVENT with alarm
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProjetoSmartPlan//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reminder.id}@projetosmartplan.ufu.br`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(dueAt)}`,
    `DTEND:${formatDate(new Date(dueAt.getTime() + 3600000))}`, // 1 hour duration
    `SUMMARY:${escapeText(reminder.title)}`,
  ];
  
  if (reminder.description) {
    lines.push(`DESCRIPTION:${escapeText(reminder.description)}`);
  }
  
  // Add category based on type
  const category = reminder.type === 'exam_assignment' ? 'Prova/Trabalho' : 'Reunião';
  lines.push(`CATEGORIES:${category}`);
  
  // Add recurrence rule if needed
  if (reminder.repeat !== 'none') {
    const freqMap: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
    };
    const freq = freqMap[reminder.repeat] || reminder.repeat.toUpperCase();
    lines.push(`RRULE:FREQ=${freq}`);
  }
  
  // Add alarm/reminder
  if (reminder.remindBeforeMinutes > 0) {
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeText(reminder.title)}`);
    lines.push(`TRIGGER:-PT${reminder.remindBeforeMinutes}M`);
    lines.push('END:VALARM');
  }
  
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Escape special characters for iCalendar format
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
