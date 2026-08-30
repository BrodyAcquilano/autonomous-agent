import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getRouterAgentProfile,
} from "../../Runtime/Agents.js";

import {
  getAllModels,
  getModelById,
} from "../MongoDB/Models.js";

import {
  getAllApis,
  getApiById,
} from "../MongoDB/Apis.js";

import {
  getAllTools,
  getToolById,
} from "../MongoDB/Tools.js";

import {
  getAllCapabilities,
  getCapabilityById,
  insertCapability,
} from "../MongoDB/Capabilities.js";

import {
  createMaintenanceTicket,
  getActiveTicket,
  deleteTicket,
} from "../MongoDB/MaintenanceTickets.js";

import {
  appendRouterRunTrace,
  createRouterRun,
  updateRouterRun,
} from "../MongoDB/AnalyticsRouterLog.js";

import {
  createJsonFileAttachment,
  getSafeFileName,
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
} from "./AnalystAgent.js";

import {
  executeRoute,
} from "./TempWorker.js";


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


/*
 * The user's own file attachments (images/PDFs)
 * are never sent to the Router's own reasoning
 * calls — they go straight to the Temp Worker,
 * which is the only place that ever touches
 * their actual bytes (see buildInput() in
 * Files/Attachments.js, used by TempWorker.js).
 * The Router only gets a cheap manifest of
 * names/types so it can factor "there is a PDF
 * attached" into model/tool selection without
 * the cost of running vision/document input
 * through every one of its own stage calls.
 */
function buildAttachmentManifest(
  attachments,
) {
  if (
    !attachments?.length
  ) {
    return "(no files attached to this request)";
  }


  return attachments
    .map(
      (
        file,
      ) =>
        `${getSafeFileName(
          file.originalname,
        )} (${
          file.mimetype ||
          "unknown type"
        })`,
    )
    .join(
      "\n",
    );
}


function buildStageInput({
  stageLabel,
  task,
  sections,
  controlPanelSettings,
  attachments,
}) {
  const content =
    [
      {
        type:
          "input_text",

        text:
          `=== STAGE ===\n${stageLabel}\n\n=== TASK ===\n${task}`,
      },

      {
        type:
          "input_text",

        text:
          `=== ATTACHED FILES (names/types only — you never see their contents; they are sent directly to the Temp Worker for execution) ===\n${buildAttachmentManifest(
            attachments,
          )}`,
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


  /*
   * Named "suggested", not "control-panel-
   * settings", on purpose — the Router's own
   * prompt is explicit that nothing in this
   * file is a hard rule: an enabled tool is a
   * candidate it's free to skip if the task
   * doesn't need it, and a disabled tool is the
   * user's current default preference, not a
   * prohibition, if the task genuinely needs it.
   */
  content.push(
    createJsonFileAttachment(
      "suggested-request-settings.json",
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

/*
 * The "state" a ticket carries is deliberately
 * just ids and primitive fields, never full
 * Mongo documents — a restart re-fetches every
 * document fresh by these ids rather than
 * trusting anything cached here, so a restart
 * never works from data that went stale between
 * when the ticket was filed and when a human
 * acts on it.
 */
function buildResumeState(
  context,
) {
  return {
    runId:
      context.runId ||
      null,

    task:
      context.task,

    controlPanelSettings:
      context.controlPanelSettings ||
      {},

    stage:
      context.stage,

    ...context.routeSoFar,
  };
}


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

      state:
        buildResumeState(
          context,
        ),
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

      state:
        buildResumeState(
          context,
        ),
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
 * Analyst agent only ever reads it back and
 * returns a verdict. Its only side effects are
 * requested through that verdict: file a
 * ticket and/or stop the run.
 */
async function reviewStageAndMaybeStop({
  runId,
  task,
  controlPanelSettings,
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
     * Analyst agent's own judgment, not the
     * Router's — it goes into that agent's own
     * maintenance collection even though the
     * server is what physically performs the
     * write (the Analyst has no database access
     * of its own).
     */
    await createMaintenanceTicket(
      "analyst",
      {
        type:
          verdict.ticketType ||
          "request",

        message:
          verdict.ticketMessage ||
          "Analyst agent flagged this run.",

        details:
          verdict.ticketDetails ||
          verdict.reasoning ||
          "",

        stage,

        task,

        context:
          routeSoFar,

        state:
          buildResumeState(
            {
              runId,
              task,
              controlPanelSettings,
              stage,
              routeSoFar,
            },
          ),
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
   ROUTER RUN
-------------------------------- */

async function runRouter({
  task,
  controlPanelSettings,
  attachments =
    [],
  resumeTicketId,
}) {
  /*
   * A restart re-enters through this same
   * function with a maintenance ticket id
   * instead of fresh task text. The ticket's
   * saved `state` is the only thing trusted for
   * "what stage were we at" and "what was
   * already chosen" — the ticket is consumed
   * (removed from the active queue) immediately,
   * since a second failure during the resumed
   * run files its own new ticket rather than
   * reusing this one. Its permanent per-agent
   * log entry is untouched.
   */
  let resumeState =
    null;

  if (
    resumeTicketId
  ) {
    const ticket =
      await getActiveTicket(
        resumeTicketId,
      );


    if (
      !ticket ||
      !ticket.state
    ) {
      throw new Error(
        `Maintenance ticket "${resumeTicketId}" was not found or has no resumable state.`,
      );
    }


    resumeState =
      ticket.state;

    task =
      resumeState.task;

    controlPanelSettings =
      resumeState.controlPanelSettings;


    await deleteTicket(
      resumeTicketId,
    );
  }


  /*
   * "executing" (the Temp Worker handoff) is
   * treated as stage 6 here purely so every
   * stage guard below can use a single ">"
   * comparison against this number.
   */
  const resumeStage =
    !resumeState
      ? 0
      : resumeState.stage ===
        "executing"
        ? 6
        : resumeState.stage;


  /*
   * The Router's profile is loaded once at
   * server startup (server/Runtime/Agents.js),
   * not re-fetched from MongoDB on every call —
   * this just reads the already-live instance.
   */
  const instructions =
    getRouterAgentProfile().contentMarkdown;


  const models =
    await getAllModels();


  if (
    resumeStage <=
      1 &&
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

          state:
            buildResumeState(
              {
                task,
                controlPanelSettings,
                stage:
                  1,
                routeSoFar:
                  {},
              },
            ),
        },
      );


    return {
      status:
        "blocked",

      ticket,
    };
  }


  let runId;

  if (
    resumeState?.runId
  ) {
    runId =
      resumeState.runId;

    await updateRouterRun(
      runId,
      {
        stage:
          resumeState.stage,

        status:
          "resumed",
      },
    );
  } else {
    const run =
      await createRouterRun({
        task,

        controlPanelSettings:
          controlPanelSettings ||
          {},
      });


    runId =
      run._id.toString();
  }


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
          controlPanelSettings,
          runId,
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
          controlPanelSettings,
          runId,
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

  let model;

  if (
    resumeStage >
    1
  ) {
    model =
      await getModelById(
        resumeState.modelId,
      );


    if (
      !model
    ) {
      return protocolError(
        1,
        new Error(
          `Resume ticket referenced model ${resumeState.modelId}, which no longer exists.`,
        ),
        {},
      );
    }
  } else {
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

        attachments,
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
                      item,
                    ) =>
                      item._id.toString(),
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
          controlPanelSettings,

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


    model =
      models.find(
        (
          item,
        ) =>
          item._id.toString() ===
          stage1Decision.modelId,
      );
  }


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

  let api;

  if (
    resumeStage >
    2
  ) {
    api =
      await getApiById(
        resumeState.apiId,
      );


    if (
      !api
    ) {
      return protocolError(
        2,
        new Error(
          `Resume ticket referenced API ${resumeState.apiId}, which no longer exists.`,
        ),
        {
          modelId:
            model._id.toString(),
        },
      );
    }
  } else {
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

        attachments,
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
          controlPanelSettings,

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


    api =
      apis.find(
        (
          item,
        ) =>
          item._id.toString() ===
          stage2Decision.apiId,
      );
  }


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

  let selectedTools =
    [];


  if (
    resumeStage >
    3
  ) {
    const resumeToolIds =
      resumeState.toolIds ||
      [];

    selectedTools =
      await Promise.all(
        resumeToolIds.map(
          (
            id,
          ) =>
            getToolById(
              id,
            ),
        ),
      );


    if (
      selectedTools.some(
        (
          item,
        ) =>
          !item,
      )
    ) {
      return protocolError(
        3,
        new Error(
          "Resume ticket referenced a tool that no longer exists.",
        ),
        {
          modelId:
            model._id.toString(),

          apiId:
            api._id.toString(),
        },
      );
    }
  } else {
    const tools =
      await getAllTools({
        model:
          model._id.toString(),

        api:
          api._id.toString(),
      });


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

        attachments,
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
          controlPanelSettings,

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

  let toolConfigurations =
    [];


  if (
    resumeStage >
    4
  ) {
    const storedConfigurations =
      resumeState.toolConfigurations ||
      [];


    for (
      const stored
      of storedConfigurations
    ) {
      const tool =
        await getToolById(
          stored.toolId,
        );

      const capability =
        await getCapabilityById(
          stored.capabilityId,
        );


      if (
        !tool ||
        !capability
      ) {
        return protocolError(
          4,
          new Error(
            "Resume ticket referenced a tool or capability that no longer exists.",
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
    }
  } else if (
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

        attachments,
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
          controlPanelSettings,

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

  let isImagesFamily;
  let finalRequestFields;

  if (
    resumeStage >
    5
  ) {
    /*
     * A ticket filed at "executing" means every
     * router stage already completed — the
     * assembled request itself is what's
     * replayed, unchanged, against the freshly
     * re-fetched model/api docs above. Only the
     * Temp Worker call failed, so only that call
     * is retried.
     */
    isImagesFamily =
      api.apiFamily ===
      "images";

    finalRequestFields =
      resumeState.finalRequestFields ||
      {};
  } else {
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

      attachments,
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
        controlPanelSettings,

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


  isImagesFamily =
    api.apiFamily ===
    "images";


  finalRequestFields =
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
     HAND OFF TO THE TEMP WORKER
  ------------------------------ */

  /*
   * The Router's job ends at assembling the
   * route. Executing it is the Temp Worker's
   * job — a separate, unconfigured agent with
   * no reasoning prompt of its own, which logs
   * its own token usage to analytics.worker
   * independently of the Router's own
   * analytics.router stage log. This is a plain
   * in-process function call today, not a real
   * agent-to-agent call through any kernel —
   * see 03-agent-organization.md.
   */
  const workerResult =
    await executeRoute(
      {
        runId,

        task,

        model,

        apiFamily:
          isImagesFamily
            ? "images"
            : "responses",

        finalRequestFields,

        attachments,
      },
    );


  if (
    workerResult.status ===
    "failed"
  ) {
    return protocolError(
      "executing",
      new Error(
        `Worker execution failed: ${workerResult.errorMessage}`,
      ),
      {
        modelId:
          model._id.toString(),

        apiId:
          api._id.toString(),

        finalRequestFields,
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
      workerResult.response,
  };
}


export {
  runRouter,
};
