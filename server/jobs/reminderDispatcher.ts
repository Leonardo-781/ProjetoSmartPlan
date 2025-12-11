import { storage } from "../storage";
import { ONE_MINUTE_MS } from "../constants";

/**
 * Reminder Dispatcher Job
 * 
 * Finds reminders that need to be notified based on:
 * - due_at - remind_before_minutes <= now < due_at + 1 minute
 * 
 * Creates notification records and logs them.
 * In future iterations, this can send actual emails/push notifications.
 */
export async function dispatchReminders(): Promise<void> {
  const now = new Date();
  console.log(`[ReminderDispatcher] Running at ${now.toISOString()}`);
  
  try {
    // Get reminders that should be notified now
    const reminders = await storage.getRemindersForDispatch(now);
    
    console.log(`[ReminderDispatcher] Found ${reminders.length} reminders to dispatch`);
    
    for (const reminder of reminders) {
      // Check if we've already notified for this reminder recently
      const existingNotifications = await storage.getReminderNotifications(reminder.id);
      
      // Avoid duplicate notifications within the same minute
      const recentNotification = existingNotifications.find((n) => {
        if (!n.notifiedAt) return false;
        const diff = now.getTime() - n.notifiedAt.getTime();
        return diff < ONE_MINUTE_MS;
      });
      
      if (recentNotification) {
        console.log(`[ReminderDispatcher] Skipping reminder ${reminder.id} - already notified recently`);
        continue;
      }
      
      // Create notification record
      await storage.createReminderNotification({
        reminderId: reminder.id,
      });
      
      // Log the notification (in future, send email/push notification here)
      console.log(`[ReminderDispatcher] ✓ Notification created for reminder:`, {
        id: reminder.id,
        title: reminder.title,
        type: reminder.type,
        ownerEmail: reminder.ownerEmail,
        dueAt: reminder.dueAt,
        remindBeforeMinutes: reminder.remindBeforeMinutes,
      });
    }
    
    console.log(`[ReminderDispatcher] Completed successfully`);
  } catch (error) {
    console.error(`[ReminderDispatcher] Error:`, error);
    throw error;
  }
}

// Allow running as standalone script
// Check if this file is being executed directly
const isMainModule = process.argv[1]?.endsWith('reminderDispatcher.ts') || 
                     process.argv[1]?.endsWith('reminderDispatcher.js');

if (isMainModule) {
  dispatchReminders()
    .then(() => {
      console.log("[ReminderDispatcher] Standalone execution completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[ReminderDispatcher] Standalone execution failed:", error);
      process.exit(1);
    });
}
