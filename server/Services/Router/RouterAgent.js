import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  createImage,
} from "../Azure/OpenAIImages.js";

import {
  getAgentByName,
} from "../MongoDB/Agents.js";

import {
  getAllModels,
} from "../MongoDB/Models.js";

import {
  getAllApis,
} from "../MongoDB/Apis.js";

import {
  getAllTools,
} from "../MongoDB/Tools.js";

import {
  getAllCapabilities,
  insertCapability,
} from "../MongoDB/Capabilities.js";

import {
  createMaintenanceTicket,
} from "../MongoDB/MaintenanceTickets.js";

import {
  appendRouterRunTrace,
  createRouterRun,
  updateRouterRun,
} from "../MongoDB/AnalyticsRouterLog.js";

import {
  buildInput,
  createJsonFileAttachment,
} from "../Files/Attachments.js";

import {
  buildStage1Schema,
  buildStage2Schema,
  buildStage3Schema,
  buildStage4Schema,
  buildStage5Schema,
  getStageTextFormat,
} from "./RouterSchemas.js";

import {
  reviewRouterStage,
} from "./AnalyticsAgent.js";


const ROUTER_AGENT_NAME =
  "router";


/*
 * The Router's OWN reasoning calls always run
 * on this fixed model with web_search enabled
 * as its only tool, independent of whatever
 * tools the task itself ends up routed to.
 */
const ROUTER_MODEL =
  "gpt-5.6-terra";


const ROUTER_TOOLS = [
  {
    type:
      "web_search",
  },
];


const RESPONSES_FINAL_REQUEST_FIELDS = [
  "instructions",
  "reasoning",
  "max_output_tokens",
  "tools",
  "tool_choice",
  "parallel_tool_calls",
  "max_tool_calls",
  "text",
  "previous_response_id",
  "store",
  "stream",
  "background",
  "metadata",
  "include",
];


/*
 * The gpt-image-2-images-api document
 * (correctly) teaches the Router the raw
 * Azure Images API field names, since that
 * is the real wire format. The internal
 * createImage() service, though, takes
 * camelCase parameter names. Map from what
 * the Router will naturally produce to what
 * the service expects, rather than asking
 * the Router to know an internal-only shape.
 */
const IMAGES_FIELD_MAP = {
  size: "size",
  quality: "quality",
  n: "numberOfImages",
  output_format: "outputFormat",
  background: "background",
  output_compression: "outputCompression",
};


/* --------------------------------
   PROMPT HELPERS
-------------------------------- */

function formatDocsForPrompt(
  docs,
) {
  if (
    !docs.length
  ) {
    return "(none available)";
  }


  return docs
    .map(
      (
        doc,
      ) =>
        `--- _id: ${doc._id.toString()} | name: ${doc.name} ---\n${
          doc.contentMarkdown ||
          "(no markdown)"
        }`,
    )
    .join(
      "\n\n",
    );
}


function buildStageInput({
  stageLabel,
  task,
  sections,
  controlPanelSettings,
}) {
  const content =
    [
      {
        type:
          "input_text",

        text:
          `=== STAGE ===\n${stageLabel}\n\n=== TASK ===\n${task}`,
      },
    ];


  sections.forEach(
    (
      {
        label,
        body,
      },
    ) => {
      content.push({
        type:
          "input_text",

        text:
          `=== ${label} ===\n${body}`,
      });
    },
  );


  content.push(
    createJsonFileAttachment(
      "control-panel-settings.json",
      controlPanelSettings ||
        {},
    ),
  );


  return [
    {
      role:
        "user",

      content,
    },
  ];
}


/* --------------------------------
   AZURE CALL + PARSE
-------------------------------- */

class RouterProtocolError extends Error {}


async function callRouterStage({
  instructions,
  input,
  schema,
  schemaName,
}) {
  const response =
    await createResponse({
      model:
        ROUTER_MODEL,

      input,

      instructions,

      reasoning: {
        effort:
          "medium",

        mode:
          "standard",
      },

      max_output_tokens:
        12000,

      tools:
        ROUTER_TOOLS,

      text:
        getStageTextFormat(
          schemaName,
          schema,
        ),
    });


  const outputText =
    typeof response.output_text ===
      "string"
      ? response.output_text
      : "";


  let parsed;

  try {
    parsed =
      JSON.parse(
        outputText,
      ).result;
  } catch (
    error
  ) {
    throw new RouterProtocolError(
      `Router returned unparseable output at ${schemaName}: ${error.message}`,
    );
  }


  if (
    !parsed ||
    typeof parsed.type !==
      "string"
  ) {
    throw new RouterProtocolError(
      `Router returned a malformed result at ${schemaName}.`,
    );
  }


  return {
    parsed,

    usage:
      response.usage,
  };
}


/* --------------------------------
   MAINTENANCE TICKET HELPERS
-------------------------------- */

async function fileTicketFromDecision(
  decision,
  context,
) {
  return createMaintenanceTicket(
    "router",
    {
      type:
        decision.ticketType,

      message:
        decision.message,

      details:
        decision.details,

      stage:
        context.stage,

      task:
        context.task,

      context:
        context.routeSoFar,
    },
  );
}


async function fileProtocolErrorTicket(
  error,
  context,
) {
  return createMaintenanceTicket(
    "router",
    {
      type:
        "error",

      message:
        "Router produced a response the server could not use.",

      details:
        error.message,

      stage:
        context.stage,

      task:
        context.task,

      context:
        context.routeSoFar,
    },
  );
}


/* --------------------------------
   ANALYTICS REVIEW
-------------------------------- */

/*
 * The server, not the Router, is what writes
 * the analytics log (via appendRouterRunTrace,
 * called just before this at each stage) — the
 * Analytics agent only ever reads it back and
 * returns a verdict. Its only side effects are
 * requested through that verdict: file a
 * ticket and/or stop the run.
 */
async function reviewStageAndMaybeStop({
  runId,
  task,
  stage,
  decision,
  usage,
  stagesCompleted,
  routeSoFar,
}) {
  const verdict =
    await reviewRouterStage(
      {
        runId,
        task,
        stage,
        decision,

        tokenUsage:
          usage,

        stagesCompleted,
      },
    );


  if (
    verdict.fileTicket
  ) {
    /*
     * This ticket exists because of the
     * Analytics agent's own judgment, not the
     * Router's — it goes into that agent's own
     * maintenance collection even though the
     * server is what physically performs the
     * write (Analytics has no database access
     * of its own).
     */
    await createMaintenanceTicket(
      "analytics",
      {
        type:
          verdict.ticketType ||
          "request",

        message:
          verdict.ticketMessage ||
          "Analytics agent flagged this run.",

        details:
          verdict.ticketDetails ||
          verdict.reasoning ||
          "",

        stage,

        task,

        context:
          routeSoFar,
      },
    );
  }


  if (
    verdict.action ===
    "stop"
  ) {
    await updateRouterRun(
      runId,
      {
        stage,

        status:
          "stopped_by_analytics",
      },
    );


    return {
      status:
        "stopped_by_analytics",

      runId,

      reasoning:
        verdict.reasoning,
    };
  }


  return null;
}


/* --------------------------------
   RESPONSE SHAPE ADAPTER (IMAGES)
-------------------------------- */

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


/* --------------------------------
   ROUTER RUN
-------------------------------- */

async function runRouter({
  task,
  controlPanelSettings,
  attachments =
    [],
}) {
  const agent =
    await getAgentByName(
      ROUTER_AGENT_NAME,
    );


  if (
    !agent
  ) {
    throw new Error(
      `Agent profile "${ROUTER_AGENT_NAME}" is not configured in the agents collection.`,
    );
  }


  const instructions =
    agent.contentMarkdown;


  const models =
    await getAllModels();


  if (
    !models.length
  ) {
    const ticket =
      await createMaintenanceTicket(
        "router",
        {
          type:
            "request",

          message:
            "No models are configured.",

          details:
            "The models collection is empty, so the Router cannot select a model for any task.",

          stage:
            1,

          task,

          context:
            {},
        },
      );


    return {
      status:
        "blocked",

      ticket,
    };
  }


  const run =
    await createRouterRun({
      task,

      controlPanelSettings:
        controlPanelSettings ||
        {},
    });


  const runId =
    run._id.toString();


  let stagesCompleted =
    0;


  async function blocked(
    stage,
    decision,
    routeSoFar,
  ) {
    const ticket =
      await fileTicketFromDecision(
        decision,
        {
          stage,
          task,
          routeSoFar,
        },
      );


    await updateRouterRun(
      runId,
      {
        stage,

        status:
          "blocked",

        ticketId:
          ticket._id,
      },
    );


    return {
      status:
        "blocked",

      runId,

      ticket,
    };
  }


  async function protocolError(
    stage,
    error,
    routeSoFar,
  ) {
    const ticket =
      await fileProtocolErrorTicket(
        error,
        {
          stage,
          task,
          routeSoFar,
        },
      );


    await updateRouterRun(
      runId,
      {
        stage,

        status:
          "blocked",

        ticketId:
          ticket._id,
      },
    );


    return {
      status:
        "blocked",

      runId,

      ticket,
    };
  }


  /* ------------------------------
     STAGE 1: MODEL SELECTION
  ------------------------------ */

  const stage1Input =
    buildStageInput({
      stageLabel:
        "1 — Model Selection",

      task,

      sections: [
        {
          label:
            "AVAILABLE MODELS",

          body:
            formatDocsForPrompt(
              models,
            ),
        },
      ],

      controlPanelSettings,
    });


  let stage1Decision;
  let stage1Usage;

  try {
    (
      {
        parsed:
          stage1Decision,

        usage:
          stage1Usage,
      } =
        await callRouterStage(
          {
            instructions,

            input:
              stage1Input,

            schema:
              buildStage1Schema(
                models.map(
                  (
                    model,
                  ) =>
                    model._id.toString(),
                ),
              ),

            schemaName:
              "stage1_model_decision",
          },
        )
    );
  } catch (
    error
  ) {
    return protocolError(
      1,
      error,
      {},
    );
  }


  await appendRouterRunTrace(
    runId,
    {
      stage:
        1,

      decision:
        stage1Decision,
    },
  );


  if (
    stage1Decision.type ===
    "maintenance_ticket"
  ) {
    return blocked(
      1,
      stage1Decision,
      {},
    );
  }


  stagesCompleted +=
    1;


  const stage1Stop =
    await reviewStageAndMaybeStop(
      {
        runId,
        task,

        stage:
          1,

        decision:
          stage1Decision,

        usage:
          stage1Usage,

        stagesCompleted,

        routeSoFar:
          {},
      },
    );


  if (
    stage1Stop
  ) {
    return stage1Stop;
  }


  const model =
    models.find(
      (
        item,
      ) =>
        item._id.toString() ===
        stage1Decision.modelId,
    );


  await updateRouterRun(
    runId,
    {
      stage:
        2,

      selectedModelId:
        model._id,

      selectedModelName:
        model.name,
    },
  );


  /* ------------------------------
     STAGE 2: API SELECTION
  ------------------------------ */

  const apis =
    await getAllApis({
      model:
        model._id.toString(),
    });


  if (
    !apis.length
  ) {
    return blocked(
      2,
      {
        ticketType:
          "request",

        message:
          `Model "${model.name}" has no configured API route.`,

        details:
          `The apis collection has no documents scoped to model ${model.name} (${model._id.toString()}), so no API is available to call this model through.`,
      },
      {
        modelId:
          model._id.toString(),
      },
    );
  }


  const stage2Input =
    buildStageInput({
      stageLabel:
        "2 — API Selection",

      task,

      sections: [
        {
          label:
            "SELECTED MODEL",

          body:
            `_id: ${model._id.toString()}\nname: ${model.name}\ndisplayName: ${model.displayName}`,
        },

        {
          label:
            "AVAILABLE APIS FOR THIS MODEL",

          body:
            formatDocsForPrompt(
              apis,
            ),
        },
      ],

      controlPanelSettings,
    });


  let stage2Decision;
  let stage2Usage;

  try {
    (
      {
        parsed:
          stage2Decision,

        usage:
          stage2Usage,
      } =
        await callRouterStage(
          {
            instructions,

            input:
              stage2Input,

            schema:
              buildStage2Schema(
                apis.map(
                  (
                    item,
                  ) =>
                    item._id.toString(),
                ),
              ),

            schemaName:
              "stage2_api_decision",
          },
        )
    );
  } catch (
    error
  ) {
    return protocolError(
      2,
      error,
      {
        modelId:
          model._id.toString(),
      },
    );
  }


  await appendRouterRunTrace(
    runId,
    {
      stage:
        2,

      decision:
        stage2Decision,
    },
  );


  if (
    stage2Decision.type ===
    "maintenance_ticket"
  ) {
    return blocked(
      2,
      stage2Decision,
      {
        modelId:
          model._id.toString(),
      },
    );
  }


  stagesCompleted +=
    1;


  const stage2Stop =
    await reviewStageAndMaybeStop(
      {
        runId,
        task,

        stage:
          2,

        decision:
          stage2Decision,

        usage:
          stage2Usage,

        stagesCompleted,

        routeSoFar: {
          modelId:
            model._id.toString(),
        },
      },
    );


  if (
    stage2Stop
  ) {
    return stage2Stop;
  }


  const api =
    apis.find(
      (
        item,
      ) =>
        item._id.toString() ===
        stage2Decision.apiId,
    );


  await updateRouterRun(
    runId,
    {
      stage:
        3,

      selectedApiId:
        api._id,

      selectedApiName:
        api.name,
    },
  );


  /* ------------------------------
     STAGE 3: TOOL SELECTION
  ------------------------------ */

  const tools =
    await getAllTools({
      model:
        model._id.toString(),

      api:
        api._id.toString(),
    });


  let selectedTools =
    [];


  if (
    tools.length >
    0
  ) {
    const stage3Input =
      buildStageInput({
        stageLabel:
          "3 — Tool Selection",

        task,

        sections: [
          {
            label:
              "SELECTED MODEL",

            body:
              `_id: ${model._id.toString()}\nname: ${model.name}`,
          },

          {
            label:
              "SELECTED API",

            body:
              `_id: ${api._id.toString()}\nname: ${api.name}\n\n${api.contentMarkdown}`,
          },

          {
            label:
              "AVAILABLE TOOLS FOR THIS MODEL + API",

            body:
              formatDocsForPrompt(
                tools,
              ),
          },
        ],

        controlPanelSettings,
      });


    let stage3Decision;
    let stage3Usage;

    try {
      (
        {
          parsed:
            stage3Decision,

          usage:
            stage3Usage,
        } =
          await callRouterStage(
            {
              instructions,

              input:
                stage3Input,

              schema:
                buildStage3Schema(
                  tools.map(
                    (
                      item,
                    ) =>
                      item._id.toString(),
                  ),
                ),

              schemaName:
                "stage3_tool_decision",
            },
          )
      );
    } catch (
      error
    ) {
      return protocolError(
        3,
        error,
        {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),
        },
      );
    }


    await appendRouterRunTrace(
      runId,
      {
        stage:
          3,

        decision:
          stage3Decision,
      },
    );


    if (
      stage3Decision.type ===
      "maintenance_ticket"
    ) {
      return blocked(
        3,
        stage3Decision,
        {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),
        },
      );
    }


    stagesCompleted +=
      1;


    const stage3Stop =
      await reviewStageAndMaybeStop(
        {
          runId,
          task,

          stage:
            3,

          decision:
            stage3Decision,

          usage:
            stage3Usage,

          stagesCompleted,

          routeSoFar: {
            modelId:
              model._id.toString(),

            apiId:
              api._id.toString(),
          },
        },
      );


    if (
      stage3Stop
    ) {
      return stage3Stop;
    }


    selectedTools =
      tools.filter(
        (
          item,
        ) =>
          stage3Decision.toolIds.includes(
            item._id.toString(),
          ),
      );
  }


  await updateRouterRun(
    runId,
    {
      stage:
        selectedTools.length >
        0
          ? 4
          : 5,

      selectedToolIds:
        selectedTools.map(
          (
            item,
          ) =>
            item._id,
        ),
    },
  );


  /* ------------------------------
     STAGE 4: CAPABILITY CONFIGURATION
  ------------------------------ */

  const toolConfigurations =
    [];


  if (
    selectedTools.length >
    0
  ) {
    const capabilitiesByTool =
      new Map();


    for (
      const tool
      of selectedTools
    ) {
      const capabilities =
        await getAllCapabilities({
          tool:
            tool._id.toString(),
        });


      capabilitiesByTool.set(
        tool._id.toString(),
        capabilities,
      );
    }


    const toolSections =
      selectedTools.map(
        (
          tool,
        ) => {
          const capabilities =
            capabilitiesByTool.get(
              tool._id.toString(),
            ) ||
            [];


          return {
            label:
              `TOOL: ${tool.name} (_id: ${tool._id.toString()})`,

            body:
              `${tool.contentMarkdown}\n\nEXISTING CAPABILITIES FOR THIS TOOL:\n${formatDocsForPrompt(
                capabilities,
              )}`,
          };
        },
      );


    const validCapabilityIds =
      Array.from(
        capabilitiesByTool.values(),
      )
        .flat()
        .map(
          (
            capability,
          ) =>
            capability._id.toString(),
        );


    const stage4Input =
      buildStageInput({
        stageLabel:
          "4 — Capability Configuration",

        task,

        sections: [
          {
            label:
              "SELECTED MODEL",

            body:
              `_id: ${model._id.toString()}\nname: ${model.name}`,
          },

          {
            label:
              "SELECTED API",

            body:
              `_id: ${api._id.toString()}\nname: ${api.name}`,
          },

          {
            label:
              "SELECTED TOOLS",

            body:
              selectedTools
                .map(
                  (
                    tool,
                  ) =>
                    `${tool.name} (_id: ${tool._id.toString()})`,
                )
                .join(
                  ", ",
                ),
          },

          ...toolSections,
        ],

        controlPanelSettings,
      });


    let stage4Decision;
    let stage4Usage;

    try {
      (
        {
          parsed:
            stage4Decision,

          usage:
            stage4Usage,
        } =
          await callRouterStage(
            {
              instructions,

              input:
                stage4Input,

              schema:
                buildStage4Schema(
                  selectedTools.map(
                    (
                      tool,
                    ) =>
                      tool._id.toString(),
                  ),

                  validCapabilityIds,
                ),

              schemaName:
                "stage4_tool_configurations",
            },
          )
      );
    } catch (
      error
    ) {
      return protocolError(
        4,
        error,
        {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),

          toolIds:
            selectedTools.map(
              (
                tool,
              ) =>
                tool._id.toString(),
            ),
        },
      );
    }


    await appendRouterRunTrace(
      runId,
      {
        stage:
          4,

        decision:
          stage4Decision,
      },
    );


    if (
      stage4Decision.type ===
      "maintenance_ticket"
    ) {
      return blocked(
        4,
        stage4Decision,
        {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),
        },
      );
    }


    stagesCompleted +=
      1;


    const stage4Stop =
      await reviewStageAndMaybeStop(
        {
          runId,
          task,

          stage:
            4,

          decision:
            stage4Decision,

          usage:
            stage4Usage,

          stagesCompleted,

          routeSoFar: {
            modelId:
              model._id.toString(),

            apiId:
              api._id.toString(),

            toolIds:
              selectedTools.map(
                (
                  tool,
                ) =>
                  tool._id.toString(),
              ),
          },
        },
      );


    if (
      stage4Stop
    ) {
      return stage4Stop;
    }


    for (
      const config
      of stage4Decision.configurations
    ) {
      const tool =
        selectedTools.find(
          (
            item,
          ) =>
            item._id.toString() ===
            config.toolId,
        );


      if (
        config.decisionType ===
        "existing_capability"
      ) {
        const toolCapabilities =
          capabilitiesByTool.get(
            config.toolId,
          ) ||
          [];


        const capability =
          toolCapabilities.find(
            (
              item,
            ) =>
              item._id.toString() ===
              config.capabilityId,
          );


        if (
          !capability
        ) {
          return protocolError(
            4,
            new Error(
              `Router chose capability ${config.capabilityId} for tool ${config.toolId}, but that capability does not belong to that tool.`,
            ),
            {
              modelId:
                model._id.toString(),

              apiId:
                api._id.toString(),
            },
          );
        }


        toolConfigurations.push(
          {
            toolId:
              tool._id,

            toolName:
              tool.name,

            capabilityId:
              capability._id,

            requestFragment:
              capability.requestTemplate,
          },
        );

        continue;
      }


      let requestFragment;

      try {
        requestFragment =
          JSON.parse(
            config.requestTemplateJson,
          );
      } catch (
        error
      ) {
        return protocolError(
          4,
          new Error(
            `Router proposed a new capability for tool ${config.toolId} with invalid requestTemplateJson: ${error.message}`,
          ),
          {
            modelId:
              model._id.toString(),

            apiId:
              api._id.toString(),
          },
        );
      }


      const newCapability =
        await insertCapability(
          {
            name:
              config.name,

            displayName:
              config.displayName,

            tool:
              tool._id,

            toolName:
              tool.name,

            description:
              config.description,

            requestTemplate:
              requestFragment,

            contentMarkdown:
              config.contentMarkdown,
          },
        );


      toolConfigurations.push(
        {
          toolId:
            tool._id,

          toolName:
            tool.name,

          capabilityId:
            newCapability._id,

          requestFragment,
        },
      );
    }
  }


  await updateRouterRun(
    runId,
    {
      stage:
        5,

      toolConfigurations,
    },
  );


  /* ------------------------------
     STAGE 5: FINAL REQUEST ASSEMBLY
  ------------------------------ */

  const stage5Sections =
    [
      {
        label:
          "SELECTED MODEL",

        body:
          `_id: ${model._id.toString()}\nname: ${model.name}`,
      },

      {
        label:
          "SELECTED API (default request shape)",

        body:
          `_id: ${api._id.toString()}\nname: ${api.name}\napiFamily: ${api.apiFamily}\n\n${api.contentMarkdown}`,
      },

      {
        label:
          "CHOSEN TOOL CONFIGURATIONS",

        body:
          toolConfigurations.length
            ? toolConfigurations
                .map(
                  (
                    config,
                  ) =>
                    `tool: ${config.toolName}\nrequestFragment: ${JSON.stringify(
                      config.requestFragment,
                    )}`,
                )
                .join(
                  "\n\n",
                )
            : "(no tools selected — use only the API's default request shape)",
      },
    ];


  const stage5Input =
    buildStageInput({
      stageLabel:
        "5 — Final Request Assembly",

      task,

      sections:
        stage5Sections,

      controlPanelSettings,
    });


  let stage5Decision;
  let stage5Usage;

  try {
    (
      {
        parsed:
          stage5Decision,

        usage:
          stage5Usage,
      } =
        await callRouterStage(
          {
            instructions,

            input:
              stage5Input,

            schema:
              buildStage5Schema(),

            schemaName:
              "stage5_final_request",
          },
        )
    );
  } catch (
    error
  ) {
    return protocolError(
      5,
      error,
      {
        modelId:
          model._id.toString(),

        apiId:
          api._id.toString(),
      },
    );
  }


  await appendRouterRunTrace(
    runId,
    {
      stage:
        5,

      decision:
        stage5Decision,
    },
  );


  if (
    stage5Decision.type ===
    "maintenance_ticket"
  ) {
    return blocked(
      5,
      stage5Decision,
      {
        modelId:
          model._id.toString(),

        apiId:
          api._id.toString(),
      },
    );
  }


  stagesCompleted +=
    1;


  const stage5Stop =
    await reviewStageAndMaybeStop(
      {
        runId,
        task,

        stage:
          5,

        decision:
          stage5Decision,

        usage:
          stage5Usage,

        stagesCompleted,

        routeSoFar: {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),
        },
      },
    );


  if (
    stage5Stop
  ) {
    return stage5Stop;
  }


  let finalRequestRaw;

  try {
    finalRequestRaw =
      JSON.parse(
        stage5Decision.requestJson,
      );
  } catch (
    error
  ) {
    return protocolError(
      5,
      new Error(
        `Router produced invalid JSON in requestJson: ${error.message}`,
      ),
      {
        modelId:
          model._id.toString(),

        apiId:
          api._id.toString(),
      },
    );
  }


  const isImagesFamily =
    api.apiFamily ===
    "images";


  const finalRequestFields =
    {};


  if (
    isImagesFamily
  ) {
    Object.entries(
      IMAGES_FIELD_MAP,
    ).forEach(
      (
        [
          sourceField,
          targetField,
        ],
      ) => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              finalRequestRaw,
              sourceField,
            )
        ) {
          finalRequestFields[
            targetField
          ] =
            finalRequestRaw[
              sourceField
            ];
        }
      },
    );
  } else {
    RESPONSES_FINAL_REQUEST_FIELDS.forEach(
      (
        field,
      ) => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              finalRequestRaw,
              field,
            )
        ) {
          finalRequestFields[
            field
          ] =
            finalRequestRaw[
              field
            ];
        }
      },
    );
  }


  await updateRouterRun(
    runId,
    {
      stage:
        "executing",

      finalRequest:
        finalRequestFields,
    },
  );


  /* ------------------------------
     EXECUTE (WORKER STEP)
  ------------------------------ */

  let workerResponse;

  try {
    if (
      isImagesFamily
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


      workerResponse =
        adaptImagesResponse(
          rawImageResponse,

          finalRequestFields.outputFormat ||
            "png",
        );
    } else {
      workerResponse =
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
    }
  } catch (
    error
  ) {
    return protocolError(
      "executing",
      new Error(
        `Worker execution failed: ${error.message}`,
      ),
      {
        modelId:
          model._id.toString(),

        apiId:
          api._id.toString(),
      },
    );
  }


  await updateRouterRun(
    runId,
    {
      stage:
        "completed",

      status:
        "completed",
    },
  );


  return {
    status:
      "completed",

    runId,

    response:
      workerResponse,
  };
}


export {
  runRouter,
};
