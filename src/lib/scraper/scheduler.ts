import * as cron from "node-cron";
import { sendDailyReport } from "@/lib/telegram/daily-report";

let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

export function startScheduler(cronExpression: string = "0 7 * * *"): void {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log("[Scheduler] Sending daily report at", new Date().toISOString());
    try {
      const sent = await sendDailyReport();
      if (sent) {
        console.log("[Scheduler] Daily report sent successfully");
      } else {
        console.log("[Scheduler] Failed to send daily report");
      }
    } catch (err) {
      console.error("[Scheduler] Error:", err);
    }
  }, {
    timezone: "Asia/Jerusalem",
  });

  console.log(`[Scheduler] Started with cron: ${cronExpression}`);
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Scheduler] Stopped");
  }
}
