import express from "express";

import {
  getAllTools,
  getToolById,
} from "../../Services/MongoDB/Tools.js";


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
        model,
        api,
      } = req.query;


      const tools =
        await getAllTools({
          model,
          api,
        });


      return res.json({
        tools,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load tools:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load tools.",

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


      const tool =
        await getToolById(
          id,
        );


      if (
        !tool
      ) {
        return res
          .status(404)
          .json({
            error:
              "Tool not found.",
          });
      }


      return res.json({
        tool,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load tool:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load tool.",

          message:
            error.message,
        });
    }
  },
);


export default router;
