import express from "express";

import {
  getDirectoryIndex,
} from "../../Services/MongoDB/Directory.js";


const router =
  express.Router();


router.get(
  "/",
  async (
    req,
    res,
  ) => {
    try {
      const directory =
        await getDirectoryIndex();


      return res.json({
        directory,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load directory:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load directory.",

          message:
            error.message,
        });
    }
  },
);


export default router;
