import express from "express";

import {
  createResponse,
  getContainerFileContent,
} from "../../Services/Azure/OpenAIResponses.js";

import {
  buildInput,
  uploadAttachments,
  validateAttachmentSize,
} from "../../Services/Files/Attachments.js";


const router =
  express.Router();


function getRequestPayload(
  req,
) {
  /*
   * Normal application/json request:
   *
   * req.body already is the request.
   */
  if (
    typeof req.body?.request !==
    "string"
  ) {
    return req.body;
  }


  /*
   * Multipart requests cannot carry
   * nested JavaScript objects directly.
   *
   * The browser serializes the request
   * field for transport alongside the
   * actual file parts.
   */
  try {
    return JSON.parse(
      req.body.request,
    );
  } catch {
    const error =
      new Error(
        "The multipart request field could not be parsed.",
      );


    error.code =
      "INVALID_MULTIPART_REQUEST";


    throw error;
  }
}


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

  uploadAttachments,

  async (
    req,
    res,
  ) => {
    try {
      const request =
        getRequestPayload(
          req,
        );


      const attachments =
        req.files ||
        [];


      validateAttachmentSize(
        attachments,
      );


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
      } = request;


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
        buildInput(
          input,
          attachments,
        );


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


      /*
       * Preserve the complete Responses
       * API response.
       */
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


      if (
        error.code ===
          "INVALID_MULTIPART_REQUEST" ||
        error.code ===
          "INVALID_ATTACHMENT_INPUT"
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid request.",

            message:
              error.message,
          });
      }


      if (
        error.code ===
        "ATTACHMENTS_TOO_LARGE"
      ) {
        return res
          .status(413)
          .json({
            error:
              "Attachments are too large.",

            message:
              error.message,
          });
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

router.get(
  "/containers/:containerId/files/:fileId/content",

  async (
    req,
    res,
  ) => {
    try {
      const {
        containerId,
        fileId,
      } =
        req.params;


      const content =
        await getContainerFileContent({
          containerId,
          fileId,
        });


      res.setHeader(
        "Content-Type",
        "application/octet-stream",
      );


      res.setHeader(
        "Cache-Control",
        "no-store",
      );


      return res.send(
        content,
      );
    } catch (
      error
    ) {
      console.error(
        "Azure container file retrieval failed:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Azure container file retrieval failed.",

          message:
            error.message,
        });
    }
  },
);


export default router;
