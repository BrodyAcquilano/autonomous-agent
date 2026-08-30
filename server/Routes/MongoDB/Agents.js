import express from "express";

import {
  getAllAgents,
  getAgentById,
} from "../../Services/MongoDB/Agents.js";


const router =
  express.Router();


router.get(
  "/",
  async (
    req,
    res,
  ) => {
    try {
      const agents =
        await getAllAgents();


      return res.json({
        agents,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load agents:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load agents.",

          message:
            error.message,
        });
    }
  },
);


router.get(
  "/:id",
  async (
    req,
    res,
  ) => {
    try {
      const {
        id,
      } = req.params;


      const agent =
        await getAgentById(
          id,
        );


      if (
        !agent
      ) {
        return res
          .status(404)
          .json({
            error:
              "Agent not found.",
          });
      }


      return res.json({
        agent,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load agent:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load agent.",

          message:
            error.message,
        });
    }
  },
);


export default router;
