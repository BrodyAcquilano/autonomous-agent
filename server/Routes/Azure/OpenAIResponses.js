import express from "express";

import {
  createResponse,
} from "../../Services/Azure/OpenAIResponses.js";


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
        input,
        instructions,
        maxOutputTokens,
      } = req.body;


      if (
        typeof input !==
          "string" ||
        !input.trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Input is required.",
          });
      }


      const response =
        await createResponse({
          input:
            input.trim(),

          instructions,

          maxOutputTokens,
        });


      return res.json({
        id:
          response.id,

        model:
          response.model,

        output:
          response.output_text,

        usage:
          response.usage,
      });
    } catch (
      error
    ) {
      console.error(
        "Azure OpenAI Responses request failed:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Azure OpenAI request failed.",

          message:
            error.message,
        });
    }
  },
);


export default router;