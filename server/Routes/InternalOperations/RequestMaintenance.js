import express from "express";

import { runMaintenanceSweep } from "../../Services/Maintenance/MaintenanceAgent.js";


const router = express.Router();


/*
 * A structurally separate request from
 * /api/request-service — that route asks the
 * company to DO a task (Router -> Temp Worker);
 * this route asks the company to investigate its
 * own Capabilities Brain and file tickets about
 * it (Maintenance agent only). `focus` is
 * optional free text from the Maintenance
 * portal's own command shell describing what to
 * look into; omitting it runs a background-style
 * sweep of whatever is currently queued.
 */
router.post("/request", async (req, res) => {
  try {
    const { focus } = req.body || {};

    const result = await runMaintenanceSweep({ focus });

    return res.json(result);
  } catch (error) {
    console.error("Maintenance request failed:", error);

    return res.status(500).json({
      error: "Maintenance request failed.",
      message: error.message,
    });
  }
});


export default router;
