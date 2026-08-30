import express from "express";

import {
  runRouter,
} from "../../Services/Router/RouterAgent.js";

import {
  uploadAttachments,
  validateAttachmentSize,
} from "../../Services/Files/Attachments.js";


const router =
  express.Router();


function getRequestPayload(
  req,
) {
  if (
    typeof req.body?.request !==
    "string"
  ) {
    return req.body;
  }


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
        task,
        controlPanelSettings,
        ticketId,
      } = request;


      /*
       * A restart re-runs the task fresh from
       * Stage 1, using the task text saved on a
       * previously filed maintenance ticket
       * rather than the request body. A brand-new
       * request still requires task text up front.
       */
      if (
        !ticketId &&
        (
          typeof task !==
            "string" ||
          !task.trim()
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "task is required.",
          });
      }


      const result =
        await runRouter(
          {
            task:
              typeof task ===
              "string"
                ? task.trim()
                : task,

            controlPanelSettings,

            attachments,

            ticketId,
          },
        );


      return res.json(
        result,
      );
    } catch (
      error
    ) {
      console.error(
        "Request service call failed:",
        error,
      );


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
            "Request service call failed.",

          message:
            error.message,
        });
    }
  },
);


export default router;
