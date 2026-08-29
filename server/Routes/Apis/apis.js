import express from "express";

import {
  getAllApis,
  getApiById,
} from "../../Services/MongoDB/Apis.js";


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
      } = req.query;


      const apis =
        await getAllApis({
          model,
        });


      return res.json({
        apis,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load apis:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load apis.",

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


      const api =
        await getApiById(
          id,
        );


      if (
        !api
      ) {
        return res
          .status(404)
          .json({
            error:
              "API not found.",
          });
      }


      return res.json({
        api,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load api:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load api.",

          message:
            error.message,
        });
    }
  },
);


export default router;
