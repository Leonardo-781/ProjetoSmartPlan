import { storage } from "../storage";
import { log } from "../index";

/**
 * Reminder dispatcher - finds reminders that need to be notified
 * and creates notification records
 */
export async function dispatchReminders(): Promise<{
  processed: number;
  notified: number;
}> {
  const now = new Date();
  log(`[Reminder Dispatcher] Running at ${now.toISOString()}`, "dispatcher");

  try {
    // Get all reminders that need to be dispatched
    const remindersToNotify = await storage.getRemindersForDispatch(now);
    
    log(`[Reminder Dispatcher] Found ${remindersToNotify.length} reminders to notify`, "dispatcher");

    let notifiedCount = 0;
    
    for (const reminder of remindersToNotify) {
      try {
        // Create notification record
        await storage.createReminderNotification({
          reminderId: reminder.id,
        });
        
        // Log the notification
        log(
          `[Reminder Dispatcher] Notified: "${reminder.title}" (ID: ${reminder.id}, Type: ${reminder.type}, Due: ${reminder.dueAt.toISOString()})`,
          "dispatcher"
        );
        
        notifiedCount++;
      } catch (error) {
        log(
          `[Reminder Dispatcher] Error notifying reminder ${reminder.id}: ${error}`,
          "dispatcher"
        );
      }
    }

    log(
      `[Reminder Dispatcher] Completed - Processed ${remindersToNotify.length}, Notified ${notifiedCount}`,
      "dispatcher"
    );

    return {
      processed: remindersToNotify.length,
      notified: notifiedCount,
    };
  } catch (error) {
    log(`[Reminder Dispatcher] Error: ${error}`, "dispatcher");
    throw error;
  }
}
