import express from "express";

import {
  getAllActiveTickets,
  updateTicketStatus,
  deleteTicket,
} from "../../Services/MongoDB/MaintenanceTickets.js";

import {
  getLogsForAgent,
  deleteLogEntry,
} from "../../Services/MongoDB/MaintenanceLogs.js";


const router =
  express.Router();


router.get(
  "/tickets",
  async (
    req,
    res,
  ) => {
    try {
      const tickets =
        await getAllActiveTickets();


      return res.json({
        tickets,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load maintenance tickets:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load maintenance tickets.",

          message:
            error.message,
        });
    }
  },
);


/*
 * "Reviewed, come back to it later" — updates
 * status only, the ticket stays in the active
 * queue. Not a general PATCH-any-field endpoint
 * on purpose: status is the only thing a human
 * reviewing a ticket is ever allowed to change
 * about it directly.
 */
router.patch(
  "/tickets/:id",
  async (
    req,
    res,
  ) => {
    try {
      const {
        id,
      } = req.params;

      const {
        status,
      } = req.body;


      if (
        status !==
          "new" &&
        status !==
          "reviewed"
      ) {
        return res
          .status(400)
          .json({
            error:
              "status must be \"new\" or \"reviewed\".",
          });
      }


      const ticket =
        await updateTicketStatus(
          id,
          status,
        );


      if (
        !ticket
      ) {
        return res
          .status(404)
          .json({
            error:
              "Ticket not found.",
          });
      }


      return res.json({
        ticket,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to update maintenance ticket:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to update maintenance ticket.",

          message:
            error.message,
        });
    }
  },
);


/*
 * "Reviewed, ignored" — a human decided no
 * action is needed. Removes the ticket from the
 * active queue; the permanent per-agent log
 * entry is untouched. This is the only way a
 * ticket is ever removed by direct human choice
 * — the other removal path is a restart
 * consuming it via the request-service route,
 * not this one.
 */
router.delete(
  "/tickets/:id",
  async (
    req,
    res,
  ) => {
    try {
      const {
        id,
      } = req.params;


      await deleteTicket(
        id,
      );


      return res.json({
        status:
          "ignored",
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to ignore maintenance ticket:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to ignore maintenance ticket.",

          message:
            error.message,
        });
    }
  },
);


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
        `Failed to load maintenance logs for "${req.params.agentName}":`,
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load maintenance logs.",

          message:
            error.message,
        });
    }
  },
);


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


      await deleteLogEntry(
        agentName,
        id,
      );


      return res.json({
        status:
          "deleted",
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to delete maintenance log entry:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to delete maintenance log entry.",

          message:
            error.message,
        });
    }
  },
);


export default router;
