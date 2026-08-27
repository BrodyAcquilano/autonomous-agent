import express from "express";

import multer from "multer";

import {
  createResponse,
  getContainerFileContent,
} from "../../Services/Azure/OpenAIResponses.js";


const router =
  express.Router();


const ACCEPTED_IMAGE_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);


const ACCEPTED_FILE_TYPES =
  new Set([
    "application/pdf",
  ]);


const MAX_ATTACHMENTS =
  10;


const MAX_FILE_SIZE_BYTES =
  20 *
  1024 *
  1024;


const MAX_TOTAL_ATTACHMENT_BYTES =
  40 *
  1024 *
  1024;


const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      files:
        MAX_ATTACHMENTS,

      fileSize:
        MAX_FILE_SIZE_BYTES,
    },

    fileFilter: (
      req,
      file,
      callback,
    ) => {
      const isAccepted =
        ACCEPTED_IMAGE_TYPES.has(
          file.mimetype,
        ) ||
        ACCEPTED_FILE_TYPES.has(
          file.mimetype,
        );


      if (
        isAccepted
      ) {
        callback(
          null,
          true,
        );

        return;
      }


      const error =
        new Error(
          `Unsupported attachment type: ${file.mimetype || "unknown"}.`,
        );


      error.code =
        "UNSUPPORTED_ATTACHMENT_TYPE";


      callback(
        error,
      );
    },
  });


function uploadAttachments(
  req,
  res,
  next,
) {
  upload.array(
    "attachments",
    MAX_ATTACHMENTS,
  )(
    req,
    res,
    (
      error,
    ) => {
      if (
        !error
      ) {
        next();

        return;
      }


      if (
        error instanceof
        multer.MulterError
      ) {
        const status =
          error.code ===
          "LIMIT_FILE_SIZE"
            ? 413
            : 400;


        res
          .status(
            status,
          )
          .json({
            error:
              "Attachment upload failed.",

            message:
              error.message,
          });

        return;
      }


      if (
        error.code ===
        "UNSUPPORTED_ATTACHMENT_TYPE"
      ) {
        res
          .status(415)
          .json({
            error:
              "Unsupported attachment type.",

            message:
              error.message,
          });

        return;
      }


      res
        .status(400)
        .json({
          error:
            "Attachment upload failed.",

          message:
            error.message,
        });
    },
  );
}


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


function getSafeFileName(
  fileName,
) {
  return String(
    fileName ||
    "attachment",
  ).replace(
    /[\r\n"]/g,
    "_",
  );
}


function createAttachmentContent(
  file,
) {
  const base64 =
    file.buffer.toString(
      "base64",
    );


  if (
    ACCEPTED_IMAGE_TYPES.has(
      file.mimetype,
    )
  ) {
    return {
      type:
        "input_image",

      image_url:
        `data:${file.mimetype};base64,${base64}`,

      detail:
        "auto",
    };
  }


  if (
    file.mimetype ===
    "application/pdf"
  ) {
    return {
      type:
        "input_file",

      filename:
        getSafeFileName(
          file.originalname,
        ),

      file_data:
        `data:application/pdf;base64,${base64}`,
    };
  }


  throw new Error(
    `Unsupported attachment type: ${file.mimetype}`,
  );
}


function buildInput(
  input,
  attachments,
) {
  if (
    !attachments?.length
  ) {
    return (
      typeof input ===
        "string"
        ? input.trim()
        : input
    );
  }


  /*
   * Current browser upload workflow:
   *
   * typed command
   * +
   * uploaded attachments
   *
   * More complicated structured-input
   * construction can be added later on
   * the server for agent workflows.
   */
  if (
    typeof input !==
      "string" ||
    !input.trim()
  ) {
    const error =
      new Error(
        "Attachments currently require text input.",
      );


    error.code =
      "INVALID_ATTACHMENT_INPUT";


    throw error;
  }


  const content =
    attachments.map(
      (
        file,
      ) =>
        createAttachmentContent(
          file,
        ),
    );


  content.push({
    type:
      "input_text",

    text:
      input.trim(),
  });


  return [
    {
      role:
        "user",

      content,
    },
  ];
}


function validateAttachmentSize(
  attachments,
) {
  const totalBytes =
    attachments.reduce(
      (
        total,
        file,
      ) =>
        total +
        file.size,
      0,
    );


  if (
    totalBytes >
    MAX_TOTAL_ATTACHMENT_BYTES
  ) {
    const error =
      new Error(
        "Combined attachment size exceeds the application limit.",
      );


    error.code =
      "ATTACHMENTS_TOO_LARGE";


    throw error;
  }
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