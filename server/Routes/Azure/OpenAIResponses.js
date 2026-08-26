import express from "express";

import {
  createResponse,
} from "../../Services/Azure/OpenAIResponses.js";


const router =
  express.Router();


function hasValidInput(
  input,
) {
  if (
    typeof input ===
    "string"
  ) {
    return Boolean(
      input.trim(),
    );
  }


  if (
    Array.isArray(
      input,
    )
  ) {
    return (
      input.length >
      0
    );
  }


  return false;
}


router.post(
  "/request",
  async (
    req,
    res,
  ) => {
    try {
      const {
        model,
        input,

        instructions,
        reasoning,

        max_output_tokens,

        tools,
        tool_choice,
        parallel_tool_calls,
        max_tool_calls,

        text,

        previous_response_id,

        store,
        stream,
        background,

        metadata,
        include,
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
        !hasValidInput(
          input,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Input is required.",
          });
      }


      if (
        max_output_tokens !==
          undefined &&
        max_output_tokens !==
          null &&
        (
          !Number.isInteger(
            max_output_tokens,
          ) ||
          max_output_tokens <
            1
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "max_output_tokens must be a positive integer.",
          });
      }


      if (
        background ===
          true &&
        store !==
          true
      ) {
        return res
          .status(400)
          .json({
            error:
              "Background responses require store to be true.",
          });
      }


      const normalizedInput =
        typeof input ===
          "string"
          ? input.trim()
          : input;


      const response =
        await createResponse({
          model:
            model.trim(),

          input:
            normalizedInput,

          instructions,

          reasoning,

          max_output_tokens,

          tools,

          tool_choice,

          parallel_tool_calls,

          max_tool_calls,

          text,

          previous_response_id,

          store,

          stream,

          background,

          metadata,

          include,
        });


      /*
       * Streaming Responses API requests return
       * an async stream of response events instead
       * of one completed response object.
       */
      if (
        stream ===
        true
      ) {
        res.setHeader(
          "Content-Type",
          "text/event-stream",
        );

        res.setHeader(
          "Cache-Control",
          "no-cache",
        );

        res.setHeader(
          "Connection",
          "keep-alive",
        );


        res.flushHeaders();


        for await (
          const event
          of response
        ) {
          res.write(
            `data: ${JSON.stringify(
              event,
            )}\n\n`,
          );
        }


        res.write(
          "data: [DONE]\n\n",
        );

        res.end();

        return;
      }


      return res.json(
        response,
      );
    } catch (
      error
    ) {
      console.error(
        "Azure OpenAI Responses request failed:",
        error,
      );


      if (
        res.headersSent
      ) {
        res.write(
          `data: ${JSON.stringify({
            type:
              "error",

            error:
              error.message,
          })}\n\n`,
        );

        res.end();

        return;
      }


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