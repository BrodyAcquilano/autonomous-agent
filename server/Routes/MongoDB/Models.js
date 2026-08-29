import express from "express";

import {
  getAllModels,
  getModelById,
} from "../../Services/MongoDB/Models.js";


const router =
  express.Router();


router.get(
  "/",
  async (
    req,
    res,
  ) => {
    try {
      const models =
        await getAllModels();


      return res.json({
        models,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load models:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load models.",

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


      const model =
        await getModelById(
          id,
        );


      if (
        !model
      ) {
        return res
          .status(404)
          .json({
            error:
              "Model not found.",
          });
      }


      return res.json({
        model,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load model:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load model.",

          message:
            error.message,
        });
    }
  },
);


export default router;
