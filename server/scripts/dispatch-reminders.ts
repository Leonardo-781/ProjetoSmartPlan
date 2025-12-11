#!/usr/bin/env tsx
/**
 * Script to manually run the reminder dispatcher
 * Usage: npm run reminders:dispatch
 */

import { dispatchReminders } from "../jobs/reminderDispatcher";

async function main() {
  console.log("Starting reminder dispatcher...");
  try {
    const result = await dispatchReminders();
    console.log("\nDispatcher completed successfully:");
    console.log(`  - Processed: ${result.processed}`);
    console.log(`  - Notified: ${result.notified}`);
    process.exit(0);
  } catch (error) {
    console.error("\nError running dispatcher:");
    console.error(error);
    process.exit(1);
  }
}

main();
