import express from "express";

import {
  createImage,
} from "../../Services/Azure/OpenAIImages.js";


const router =
  express.Router();


router.post(
  "/request",
  async (
    req,
    res,
  ) => {
    try {
      const {
        model,
        prompt,
        size,
        quality,
        outputFormat,
        background,
        outputCompression,
        numberOfImages,
      } = req.body;


      if (
        typeof model !==
          "string" ||
        !model.trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Model is required.",
          });
      }


      if (
        typeof prompt !==
          "string" ||
        !prompt.trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Prompt is required.",
          });
      }


      const response =
        await createImage({
          model:
            model.trim(),

          prompt:
            prompt.trim(),

          size,

          quality,

          outputFormat,

          background,

          outputCompression,

          numberOfImages,
        });


      const resolvedOutputFormat =
        outputFormat ||
        "png";


      const mimeType =
        resolvedOutputFormat ===
        "jpeg"
          ? "image/jpeg"
          : "image/png";


      const images =
        response.data.map(
          (
            image,
            index,
          ) => ({
            index,

            base64:
              image.b64_json,

            mimeType,
          }),
        );


      return res.json({
        model:
          model.trim(),

        created:
          response.created,

        outputFormat:
          resolvedOutputFormat,

        images,
      });
    } catch (
      error
    ) {
      console.error(
        "Azure OpenAI Images request failed:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Azure OpenAI image request failed.",

          message:
            error.message,
        });
    }
  },
);


export default router;