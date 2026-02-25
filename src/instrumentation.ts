export async function register() {
  // Only run scheduler on the server (not during build or in edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/scraper/scheduler");
    startScheduler("0 7 * * *");
    console.log("[Instrumentation] Scheduler started - daily report at 07:00 Israel time");
  }
}
