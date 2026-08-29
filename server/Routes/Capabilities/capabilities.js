import express from "express";

import {
  getAllCapabilities,
  getCapabilityById,
} from "../../Services/MongoDB/Capabilities.js";


const router =
  express.Router();


router.get(
  "/",
  async (
    req,
    res,
  ) => {
    try {
      const {
        tool,
      } = req.query;


      const capabilities =
        await getAllCapabilities({
          tool,
        });


      return res.json({
        capabilities,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load capabilities:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load capabilities.",

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


      const capability =
        await getCapabilityById(
          id,
        );


      if (
        !capability
      ) {
        return res
          .status(404)
          .json({
            error:
              "Capability not found.",
          });
      }


      return res.json({
        capability,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load capability:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load capability.",

          message:
            error.message,
        });
    }
  },
);


export default router;
