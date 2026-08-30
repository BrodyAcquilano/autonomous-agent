import express from "express";

import {
  getLogsForAgent,
  deleteLogEntry,
} from "../../Services/MongoDB/AnalyticsLogs.js";

import {
  deleteMaintenanceRecordsForRun,
} from "../../Services/MongoDB/MaintenanceTickets.js";


const router =
  express.Router();


router.get(
  "/logs/:agentName",
  async (
    req,
    res,
  ) => {
    try {
      const {
        agentName,
      } = req.params;


      const logs =
        await getLogsForAgent(
          agentName,
        );


      return res.json({
        logs,
      });
    } catch (
      error
    ) {
      console.error(
        `Failed to load analytics logs for "${req.params.agentName}":`,
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load analytics logs.",

          message:
            error.message,
        });
    }
  },
);


/*
 * An analytics log's own _id is what every
 * maintenance ticket/log stores as `state.runId`
 * — deleting it first removes anything in
 * maintenance still pointing at this run (a
 * dangling reference nobody could act on
 * meaningfully anyway — see
 * deleteMaintenanceRecordsForRun), then deletes
 * the analytics log itself, and reports back
 * exactly which maintenance ticket/log ids were
 * also removed so the frontend can prune its own
 * local state to match.
 */
router.delete(
  "/logs/:agentName/:id",
  async (
    req,
    res,
  ) => {
    try {
      const {
        agentName,
        id,
      } = req.params;


      const cascade =
        await deleteMaintenanceRecordsForRun(
          id,
        );


      await deleteLogEntry(
        agentName,
        id,
      );


      return res.json({
        status:
          "deleted",

        cascade,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to delete analytics log entry:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to delete analytics log entry.",

          message:
            error.message,
        });
    }
  },
);


export default router;
