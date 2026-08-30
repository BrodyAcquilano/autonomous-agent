import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  createImage,
} from "../Azure/OpenAIImages.js";

import {
  buildInput,
} from "../Files/Attachments.js";

import {
  logWorkerExecution,
} from "../MongoDB/AnalyticsWorkerLog.js";


/*
 * The Temp Worker has no permanent
 * configuration and no reasoning prompt of
 * its own — it does not call an AI model to
 * decide anything. It mechanically executes
 * whatever route the Router already fully
 * resolved (model, API, tools, capabilities
 * are all decided before this runs), and
 * reports what it did to its own analytics
 * log. Its `agents.worker` profile document
 * exists for directory/identity purposes only
 * and is never loaded as an instructions
 * prompt, unlike the Router or the Analyst.
 */


/*
 * Adapts the raw Images API shape
 * ({ created, data: [{ b64_json }] }) into
 * the shape the frontend's ResponseFiles
 * service already knows how to extract
 * ({ created, output_text, images: [...] }),
 * so the Output page needs no changes to
 * display an image-family route's result.
 */
function adaptImagesResponse(
  rawResponse,
  outputFormat,
) {
  const mimeType =
    outputFormat ===
    "jpeg"
      ? "image/jpeg"
      : outputFormat ===
        "webp"
        ? "image/webp"
        : "image/png";


  const images =
    (
      rawResponse.data ||
      []
    ).map(
      (
        item,
        index,
      ) => ({
        mimeType,

        index,

        base64:
          item.b64_json,
      }),
    );


  return {
    created:
      rawResponse.created,

    output_text:
      "",

    images,
  };
}


/*
 * Executes one fully-resolved route and logs
 * the attempt to analytics.worker, whether it
 * succeeds or fails. Never throws — the caller
 * (runRouter() in RouterAgent.js) checks the
 * returned `status` and, on failure, asks the
 * Maintenance agent for a live consult
 * attributed to the Worker's own execution
 * failure (see helpRecoverFromError in
 * MaintenanceAgent.js) — the Worker has no
 * maintenance-portal contact of its own and
 * never decides that part itself.
 */
async function executeRoute({
  runId,
  task,
  model,
  apiFamily,
  finalRequestFields,
  attachments =
    [],
}) {
  let response =
    null;

  let usage =
    null;

  let status =
    "completed";

  let errorMessage =
    null;


  try {
    if (
      apiFamily ===
      "images"
    ) {
      const rawImageResponse =
        await createImage(
          {
            model:
              model.name,

            prompt:
              task,

            ...finalRequestFields,
          },
        );


      response =
        adaptImagesResponse(
          rawImageResponse,

          finalRequestFields.outputFormat ||
            "png",
        );


      usage =
        rawImageResponse.usage ||
        null;
    } else {
      response =
        await createResponse(
          {
            model:
              model.name,

            input:
              buildInput(
                task,
                attachments,
              ),

            ...finalRequestFields,
          },
        );


      usage =
        response.usage ||
        null;
    }
  } catch (
    error
  ) {
    status =
      "failed";

    errorMessage =
      error.message;
  }


  await logWorkerExecution(
    {
      runId,

      task,

      modelId:
        model._id,

      modelName:
        model.name,

      apiFamily,

      finalRequestFields,

      usage,

      status,

      errorMessage,
    },
  );


  return {
    status,
    response,
    errorMessage,
  };
}


export {
  executeRoute,
};
