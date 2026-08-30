import { runMaintenanceSweep } from "../Services/Maintenance/MaintenanceAgent.js";


/*
 * Scaffolding for running the Maintenance agent
 * on a timer instead of only on demand from the
 * Maintenance portal's command shell. Off by
 * default — set MAINTENANCE_CRON_ENABLED=true in
 * .env to turn it on. Left disabled by default
 * because a locally-run dev server restarting
 * constantly (nodemon) is not a good environment
 * for a recurring background job; this exists so
 * the same request-maintenance code path can be
 * put on a real schedule later without changing
 * anything else.
 */
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

let intervalHandle = null;


function isEnabled() {
  return process.env.MAINTENANCE_CRON_ENABLED === "true";
}


function startMaintenanceCron() {
  if (!isEnabled()) {
    console.log("Maintenance cron is disabled (MAINTENANCE_CRON_ENABLED is not \"true\").");

    return;
  }

  const intervalMs = Number(process.env.MAINTENANCE_CRON_INTERVAL_MS) || DEFAULT_INTERVAL_MS;

  intervalHandle = setInterval(async () => {
    try {
      const result = await runMaintenanceSweep({});

      console.log(
        `Maintenance cron sweep complete: mode=${result.mode}, ticketsFiled=${result.ticketsFiled}.`,
      );
    } catch (error) {
      console.error("Maintenance cron sweep failed:", error);
    }
  }, intervalMs);

  console.log(`Maintenance cron enabled, running every ${intervalMs}ms.`);
}


function stopMaintenanceCron() {
  if (intervalHandle) {
    clearInterval(intervalHandle);

    intervalHandle = null;
  }
}


export { startMaintenanceCron, stopMaintenanceCron };
