import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getRouterAgentProfile,
} from "../../Runtime/Agents.js";

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
  createMaintenanceLog,
} from "../MongoDB/MaintenanceLogs.js";

import {
  getActiveTicket,
  deleteTicket,
} from "../MongoDB/MaintenanceTickets.js";

import {
  helpRouterRecoverFromError,
} from "../Maintenance/MaintenanceAgent.js";

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
const ROUTER_MODEL = "gpt-5.6-terra";

const ROUTER_TOOLS = [{ type: "web_search" }];

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

function formatDocsForPrompt(docs) {
  if (!docs.length) {
    return "(none available)";
  }

  return docs
    .map(
      (doc) =>
        `--- _id: ${doc._id.toString()} | name: ${doc.name} ---\n${
          doc.contentMarkdown || "(no markdown)"
        }`,
    )
    .join("\n\n");
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
function buildAttachmentManifest(attachments) {
  if (!attachments?.length) {
    return "(no files attached to this request)";
  }

  return attachments
    .map(
      (file) =>
        `${getSafeFileName(file.originalname)} (${file.mimetype || "unknown type"})`,
    )
    .join("\n");
}


function buildStageInput({
  stageLabel,
  task,
  sections,
  controlPanelSettings,
  attachments,
  maintenanceGuidance,
  stageFixGuidance,
}) {
  const content = [
    {
      type: "input_text",
      text: `=== STAGE ===\n${stageLabel}\n\n=== TASK ===\n${task}`,
    },
  ];

  /*
   * Only present when this call is a restart
   * triggered from a maintenance ticket — the
   * Maintenance agent's own investigation of why
   * the task failed last time and what to try
   * differently, given to the Router as extra
   * context on every stage of the fresh run.
   */
  if (maintenanceGuidance) {
    content.push({
      type: "input_text",
      text: `=== MAINTENANCE GUIDANCE (this task failed before a human requested a restart; read this before proceeding) ===\n${maintenanceGuidance}`,
    });
  }

  /*
   * Only present when this exact stage, within
   * this same run, just reported an error and the
   * server asked the Maintenance agent to help —
   * Maintenance's own suggested fix, fed back so
   * this stage can be retried once, immediately.
   */
  if (stageFixGuidance) {
    content.push({
      type: "input_text",
      text: `=== MAINTENANCE FIX FOR THIS STAGE (you just reported an error at this exact stage; apply this before trying again) ===\n${stageFixGuidance}`,
    });
  }

  content.push({
    type: "input_text",
    text: `=== ATTACHED FILES (names/types only — you never see their contents; they are sent directly to the Temp Worker for execution) ===\n${buildAttachmentManifest(
      attachments,
    )}`,
  });

  sections.forEach(({ label, body }) => {
    content.push({
      type: "input_text",
      text: `=== ${label} ===\n${body}`,
    });
  });

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
    createJsonFileAttachment("suggested-request-settings.json", controlPanelSettings || {}),
  );

  return [{ role: "user", content }];
}


/* --------------------------------
   AZURE CALL + PARSE
-------------------------------- */

class RouterProtocolError extends Error {}


async function callRouterStage({ instructions, input, schema, schemaName }) {
  const response = await createResponse({
    model: ROUTER_MODEL,
    input,
    instructions,
    reasoning: { effort: "medium", mode: "standard" },
    max_output_tokens: 12000,
    tools: ROUTER_TOOLS,
    text: getStageTextFormat(schemaName, schema),
  });

  const outputText = typeof response.output_text === "string" ? response.output_text : "";

  let parsed;

  try {
    parsed = JSON.parse(outputText).result;
  } catch (error) {
    throw new RouterProtocolError(`Router returned unparseable output at ${schemaName}: ${error.message}`);
  }

  if (!parsed || typeof parsed.type !== "string") {
    throw new RouterProtocolError(`Router returned a malformed result at ${schemaName}.`);
  }

  return { parsed, usage: response.usage };
}


/* --------------------------------
   RESTART GUIDANCE
-------------------------------- */

/*
 * Turns a maintenance ticket (the Maintenance
 * agent's own triage of a prior failure) into a
 * plain-language brief for the Router. The
 * Router never sees "tickets" as a concept of
 * its own — it just receives this text as extra
 * context on a run that happens to be a restart.
 */
function buildMaintenanceGuidanceText(ticket) {
  const action = ticket.recommendedAction || {};

  return [
    `WHAT WENT WRONG: ${ticket.message || "(not recorded)"}`,
    ticket.details ? `DETAILS: ${ticket.details}` : null,
    action.actionType ? `MAINTENANCE'S RECOMMENDATION (${action.actionType}): ${action.instructions || action.summary || "(no further detail)"}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
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
 * requested through that verdict: log an issue
 * for Maintenance to investigate, and/or stop
 * the run. The Analyst never files a ticket
 * itself — only the Maintenance agent does that,
 * after reading this log back later.
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
  const verdict = await reviewRouterStage({
    runId,
    task,
    stage,
    decision,
    tokenUsage: usage,
    stagesCompleted,
  });

  if (verdict.logIssue) {
    /*
     * This log exists because of the Analyst
     * agent's own judgment, not the Router's —
     * it goes into that agent's own maintenance
     * collection even though the server is what
     * physically performs the write (the Analyst
     * has no database access of its own).
     */
    await createMaintenanceLog("analyst", {
      type: verdict.logType || "request",
      message: verdict.logMessage || "Analyst agent flagged this run.",
      details: verdict.logDetails || verdict.reasoning || "",
      stage,
      task,
      context: routeSoFar,
      usage: usage || null,
      state: {
        runId,
        task,
        controlPanelSettings: controlPanelSettings || {},
      },
    });
  }

  if (verdict.action === "stop") {
    await updateRouterRun(runId, {
      stage,
      status: "stopped_by_analytics",
    });

    return {
      status: "stopped_by_analytics",
      runId,
      reasoning: verdict.reasoning,
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
  attachments = [],
  ticketId,
}) {
  /*
   * A restart re-enters through this same
   * function with a maintenance ticket id
   * instead of fresh task text. A restart is a
   * literal, full run from Stage 1 — the ticket
   * only supplies the original task/settings and
   * Maintenance's own guidance on what to try
   * differently. The ticket is consumed
   * immediately; a second failure produces its
   * own new ticket rather than reusing it.
   */
  let maintenanceGuidance = null;

  if (ticketId) {
    const ticket = await getActiveTicket(ticketId);

    if (!ticket || !ticket.state) {
      throw new Error(
        `Maintenance ticket "${ticketId}" was not found or has no resumable state.`,
      );
    }

    task = ticket.state.task;
    controlPanelSettings = ticket.state.controlPanelSettings;
    maintenanceGuidance = buildMaintenanceGuidanceText(ticket);

    await deleteTicket(ticketId);
  }

  /*
   * The Router's profile is loaded once at
   * server startup (server/Runtime/Agents.js),
   * not re-fetched from MongoDB on every call —
   * this just reads the already-live instance.
   */
  const instructions = getRouterAgentProfile().contentMarkdown;

  const run = await createRouterRun({
    task,
    controlPanelSettings: controlPanelSettings || {},
  });

  const runId = run._id.toString();


  /*
   * The single recovery path for EVERY way a
   * stage can fail to produce a usable decision:
   * the Router's own `type: "error"` result, or
   * the server itself being unable to use what it
   * got back (malformed JSON, an invalid schema
   * result). Either way this is never the
   * Router's call to make what happens next — the
   * server hands exactly what the Router saw to
   * the Maintenance agent and asks for a live,
   * time-sensitive second opinion.
   *
   * `attemptStage` performs exactly one AI call
   * attempt (given the previous attempt's fix
   * text, if any) and returns { decision, usage },
   * or throws. This loops at most twice: an
   * original attempt, and — only if Maintenance
   * hands back a fix — one retry with that fix
   * applied. If that retry ALSO fails, Maintenance
   * is asked once more but told plainly that its
   * last fix did not work and a ticket must be
   * filed now; `mustAbandon` forces the abandon
   * outcome server-side even if it answers
   * otherwise, so a run can never loop forever
   * between the Router and Maintenance.
   */
  async function runStageWithRecovery({ stage, routeSoFar, sections, attemptStage }) {
    let extraGuidance = null;
    let priorLog = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let decision;
      let usage = null;

      try {
        ({ decision, usage } = await attemptStage(extraGuidance));
      } catch (error) {
        decision = {
          type: "error",
          errorType: "error",
          errorMessage: "Router produced a response the server could not use.",
          errorDetails: error.message,
        };
      }

      if (decision.type !== "error") {
        return { decision, usage };
      }

      const consult = await helpRouterRecoverFromError({
        task,
        controlPanelSettings,
        runId,
        stage,
        routeSoFar,
        sections,
        errorType: decision.errorType,
        errorMessage: decision.errorMessage,
        errorDetails: decision.errorDetails,
        mustAbandon: attempt === 1,
        priorLog,
      });

      await appendRouterRunTrace(runId, {
        stage,
        maintenanceConsult: {
          errorType: decision.errorType,
          errorMessage: decision.errorMessage,
          outcome: consult.outcome,
        },
      });

      if (consult.outcome === "retry" && attempt === 0) {
        extraGuidance = consult.fixInstructions;
        priorLog = consult.log;
        continue;
      }

      await updateRouterRun(runId, {
        stage,
        status: "blocked",
        ticketIds: consult.tickets?.map((ticket) => ticket._id) || [],
      });

      return {
        abandoned: true,
        result: { status: "blocked", runId, tickets: consult.tickets },
      };
    }

    return undefined;
  }


  /* ------------------------------
     STAGE 1: MODEL SELECTION
  ------------------------------ */

  const models = await getAllModels();

  const stage1Outcome = await runStageWithRecovery({
    stage: 1,
    routeSoFar: {},
    sections: [{ label: "AVAILABLE MODELS", body: formatDocsForPrompt(models) }],
    attemptStage: async (extraGuidance) => {
      if (!models.length) {
        return {
          decision: {
            type: "error",
            errorType: "request",
            errorMessage: "No models are configured.",
            errorDetails:
              "The models collection is empty, so the Router cannot select a model for any task.",
          },
          usage: null,
        };
      }

      const stage1Input = buildStageInput({
        stageLabel: "1 — Model Selection",
        task,
        sections: [{ label: "AVAILABLE MODELS", body: formatDocsForPrompt(models) }],
        controlPanelSettings,
        attachments,
        maintenanceGuidance,
        stageFixGuidance: extraGuidance,
      });

      const { parsed, usage } = await callRouterStage({
        instructions,
        input: stage1Input,
        schema: buildStage1Schema(models.map((item) => item._id.toString())),
        schemaName: "stage1_model_decision",
      });

      await appendRouterRunTrace(runId, { stage: 1, decision: parsed, usage });

      return { decision: parsed, usage };
    },
  });

  if (stage1Outcome.abandoned) {
    return stage1Outcome.result;
  }

  const { decision: stage1Decision, usage: stage1Usage } = stage1Outcome;

  const stage1Stop = await reviewStageAndMaybeStop({
    runId,
    task,
    controlPanelSettings,
    stage: 1,
    decision: stage1Decision,
    usage: stage1Usage,
    stagesCompleted: 1,
    routeSoFar: {},
  });

  if (stage1Stop) {
    return stage1Stop;
  }

  const model = models.find((item) => item._id.toString() === stage1Decision.modelId);

  await updateRouterRun(runId, {
    stage: 2,
    selectedModelId: model._id,
    selectedModelName: model.name,
  });


  /* ------------------------------
     STAGE 2: API SELECTION
  ------------------------------ */

  const apis = await getAllApis({ model: model._id.toString() });

  const stage2Outcome = await runStageWithRecovery({
    stage: 2,
    routeSoFar: { modelId: model._id.toString() },
    sections: [
      {
        label: "SELECTED MODEL",
        body: `_id: ${model._id.toString()}\nname: ${model.name}\ndisplayName: ${model.displayName}`,
      },
      { label: "AVAILABLE APIS FOR THIS MODEL", body: formatDocsForPrompt(apis) },
    ],
    attemptStage: async (extraGuidance) => {
      if (!apis.length) {
        return {
          decision: {
            type: "error",
            errorType: "request",
            errorMessage: `Model "${model.name}" has no configured API route.`,
            errorDetails: `The apis collection has no documents scoped to model ${model.name} (${model._id.toString()}), so no API is available to call this model through.`,
          },
          usage: null,
        };
      }

      const stage2Input = buildStageInput({
        stageLabel: "2 — API Selection",
        task,
        sections: [
          {
            label: "SELECTED MODEL",
            body: `_id: ${model._id.toString()}\nname: ${model.name}\ndisplayName: ${model.displayName}`,
          },
          { label: "AVAILABLE APIS FOR THIS MODEL", body: formatDocsForPrompt(apis) },
        ],
        controlPanelSettings,
        attachments,
        maintenanceGuidance,
        stageFixGuidance: extraGuidance,
      });

      const { parsed, usage } = await callRouterStage({
        instructions,
        input: stage2Input,
        schema: buildStage2Schema(apis.map((item) => item._id.toString())),
        schemaName: "stage2_api_decision",
      });

      await appendRouterRunTrace(runId, { stage: 2, decision: parsed, usage });

      return { decision: parsed, usage };
    },
  });

  if (stage2Outcome.abandoned) {
    return stage2Outcome.result;
  }

  const { decision: stage2Decision, usage: stage2Usage } = stage2Outcome;

  const stage2Stop = await reviewStageAndMaybeStop({
    runId,
    task,
    controlPanelSettings,
    stage: 2,
    decision: stage2Decision,
    usage: stage2Usage,
    stagesCompleted: 2,
    routeSoFar: { modelId: model._id.toString() },
  });

  if (stage2Stop) {
    return stage2Stop;
  }

  const api = apis.find((item) => item._id.toString() === stage2Decision.apiId);

  await updateRouterRun(runId, {
    stage: 3,
    selectedApiId: api._id,
    selectedApiName: api.name,
  });


  /* ------------------------------
     STAGE 3: TOOL SELECTION
  ------------------------------ */

  const tools = await getAllTools({ model: model._id.toString(), api: api._id.toString() });

  let selectedTools = [];

  if (tools.length > 0) {
    const stage3Outcome = await runStageWithRecovery({
      stage: 3,
      routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
      sections: [
        { label: "SELECTED MODEL", body: `_id: ${model._id.toString()}\nname: ${model.name}` },
        {
          label: "SELECTED API",
          body: `_id: ${api._id.toString()}\nname: ${api.name}\n\n${api.contentMarkdown}`,
        },
        { label: "AVAILABLE TOOLS FOR THIS MODEL + API", body: formatDocsForPrompt(tools) },
      ],
      attemptStage: async (extraGuidance) => {
        const stage3Input = buildStageInput({
          stageLabel: "3 — Tool Selection",
          task,
          sections: [
            { label: "SELECTED MODEL", body: `_id: ${model._id.toString()}\nname: ${model.name}` },
            {
              label: "SELECTED API",
              body: `_id: ${api._id.toString()}\nname: ${api.name}\n\n${api.contentMarkdown}`,
            },
            { label: "AVAILABLE TOOLS FOR THIS MODEL + API", body: formatDocsForPrompt(tools) },
          ],
          controlPanelSettings,
          attachments,
          maintenanceGuidance,
          stageFixGuidance: extraGuidance,
        });

        const { parsed, usage } = await callRouterStage({
          instructions,
          input: stage3Input,
          schema: buildStage3Schema(tools.map((item) => item._id.toString())),
          schemaName: "stage3_tool_decision",
        });

        await appendRouterRunTrace(runId, { stage: 3, decision: parsed, usage });

        return { decision: parsed, usage };
      },
    });

    if (stage3Outcome.abandoned) {
      return stage3Outcome.result;
    }

    const { decision: stage3Decision, usage: stage3Usage } = stage3Outcome;

    const stage3Stop = await reviewStageAndMaybeStop({
      runId,
      task,
      controlPanelSettings,
      stage: 3,
      decision: stage3Decision,
      usage: stage3Usage,
      stagesCompleted: 3,
      routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
    });

    if (stage3Stop) {
      return stage3Stop;
    }

    selectedTools = tools.filter((item) => stage3Decision.toolIds.includes(item._id.toString()));
  }

  await updateRouterRun(runId, {
    stage: selectedTools.length > 0 ? 4 : 5,
    selectedToolIds: selectedTools.map((item) => item._id),
  });


  /* ------------------------------
     STAGE 4: CAPABILITY CONFIGURATION
  ------------------------------ */

  let toolConfigurations = [];

  if (selectedTools.length > 0) {
    const capabilitiesByTool = new Map();

    for (const tool of selectedTools) {
      const capabilities = await getAllCapabilities({ tool: tool._id.toString() });

      capabilitiesByTool.set(tool._id.toString(), capabilities);
    }

    const toolSections = selectedTools.map((tool) => {
      const capabilities = capabilitiesByTool.get(tool._id.toString()) || [];

      return {
        label: `TOOL: ${tool.name} (_id: ${tool._id.toString()})`,
        body: `${tool.contentMarkdown}\n\nEXISTING CAPABILITIES FOR THIS TOOL:\n${formatDocsForPrompt(capabilities)}`,
      };
    });

    const validCapabilityIds = Array.from(capabilitiesByTool.values())
      .flat()
      .map((capability) => capability._id.toString());

    const stage4Sections = [
      { label: "SELECTED MODEL", body: `_id: ${model._id.toString()}\nname: ${model.name}` },
      { label: "SELECTED API", body: `_id: ${api._id.toString()}\nname: ${api.name}` },
      {
        label: "SELECTED TOOLS",
        body: selectedTools
          .map((tool) => `${tool.name} (_id: ${tool._id.toString()})`)
          .join(", "),
      },
      ...toolSections,
    ];

    const stage4Outcome = await runStageWithRecovery({
      stage: 4,
      routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
      sections: stage4Sections,
      attemptStage: async (extraGuidance) => {
        const stage4Input = buildStageInput({
          stageLabel: "4 — Capability Configuration",
          task,
          sections: stage4Sections,
          controlPanelSettings,
          attachments,
          maintenanceGuidance,
          stageFixGuidance: extraGuidance,
        });

        const { parsed, usage } = await callRouterStage({
          instructions,
          input: stage4Input,
          schema: buildStage4Schema(
            selectedTools.map((tool) => tool._id.toString()),
            validCapabilityIds,
          ),
          schemaName: "stage4_tool_configurations",
        });

        await appendRouterRunTrace(runId, { stage: 4, decision: parsed, usage });

        return { decision: parsed, usage };
      },
    });

    if (stage4Outcome.abandoned) {
      return stage4Outcome.result;
    }

    const { decision: stage4Decision, usage: stage4Usage } = stage4Outcome;

    const stage4Stop = await reviewStageAndMaybeStop({
      runId,
      task,
      controlPanelSettings,
      stage: 4,
      decision: stage4Decision,
      usage: stage4Usage,
      stagesCompleted: 4,
      routeSoFar: {
        modelId: model._id.toString(),
        apiId: api._id.toString(),
        toolIds: selectedTools.map((tool) => tool._id.toString()),
      },
    });

    if (stage4Stop) {
      return stage4Stop;
    }

    for (const config of stage4Decision.configurations) {
      const tool = selectedTools.find((item) => item._id.toString() === config.toolId);

      if (config.decisionType === "existing_capability") {
        const toolCapabilities = capabilitiesByTool.get(config.toolId) || [];

        const capability = toolCapabilities.find(
          (item) => item._id.toString() === config.capabilityId,
        );

        if (!capability) {
          const consult = await helpRouterRecoverFromError({
            task,
            controlPanelSettings,
            runId,
            stage: 4,
            routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
            sections: stage4Sections,
            errorType: "error",
            errorMessage: "Router chose a capability that does not belong to the tool it named.",
            errorDetails: `capabilityId ${config.capabilityId} for toolId ${config.toolId}`,
            mustAbandon: true,
          });

          await updateRouterRun(runId, {
            stage: 4,
            status: "blocked",
            ticketIds: consult.tickets?.map((ticket) => ticket._id) || [],
          });

          return { status: "blocked", runId, tickets: consult.tickets };
        }

        toolConfigurations.push({
          toolId: tool._id,
          toolName: tool.name,
          capabilityId: capability._id,
          requestFragment: capability.requestTemplate,
        });

        continue;
      }

      let requestFragment;

      try {
        requestFragment = JSON.parse(config.requestTemplateJson);
      } catch (error) {
        const consult = await helpRouterRecoverFromError({
          task,
          controlPanelSettings,
          runId,
          stage: 4,
          routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
          sections: stage4Sections,
          errorType: "error",
          errorMessage: "Router proposed a new capability with invalid requestTemplateJson.",
          errorDetails: `toolId ${config.toolId}: ${error.message}`,
          mustAbandon: true,
        });

        await updateRouterRun(runId, {
          stage: 4,
          status: "blocked",
          ticketIds: consult.tickets?.map((ticket) => ticket._id) || [],
        });

        return { status: "blocked", runId, tickets: consult.tickets };
      }

      const newCapability = await insertCapability({
        name: config.name,
        displayName: config.displayName,
        tool: tool._id,
        toolName: tool.name,
        description: config.description,
        requestTemplate: requestFragment,
        contentMarkdown: config.contentMarkdown,
      });

      toolConfigurations.push({
        toolId: tool._id,
        toolName: tool.name,
        capabilityId: newCapability._id,
        requestFragment,
      });
    }
  }

  await updateRouterRun(runId, { stage: 5, toolConfigurations });


  /* ------------------------------
     STAGE 5: FINAL REQUEST ASSEMBLY
  ------------------------------ */

  const stage5Sections = [
    { label: "SELECTED MODEL", body: `_id: ${model._id.toString()}\nname: ${model.name}` },
    {
      label: "SELECTED API (default request shape)",
      body: `_id: ${api._id.toString()}\nname: ${api.name}\napiFamily: ${api.apiFamily}\n\n${api.contentMarkdown}`,
    },
    {
      label: "CHOSEN TOOL CONFIGURATIONS",
      body: toolConfigurations.length
        ? toolConfigurations
            .map(
              (config) =>
                `tool: ${config.toolName}\nrequestFragment: ${JSON.stringify(config.requestFragment)}`,
            )
            .join("\n\n")
        : "(no tools selected — use only the API's default request shape)",
    },
  ];

  const stage5Outcome = await runStageWithRecovery({
    stage: 5,
    routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
    sections: stage5Sections,
    attemptStage: async (extraGuidance) => {
      const stage5Input = buildStageInput({
        stageLabel: "5 — Final Request Assembly",
        task,
        sections: stage5Sections,
        controlPanelSettings,
        attachments,
        maintenanceGuidance,
        stageFixGuidance: extraGuidance,
      });

      const { parsed, usage } = await callRouterStage({
        instructions,
        input: stage5Input,
        schema: buildStage5Schema(),
        schemaName: "stage5_final_request",
      });

      await appendRouterRunTrace(runId, { stage: 5, decision: parsed, usage });

      return { decision: parsed, usage };
    },
  });

  if (stage5Outcome.abandoned) {
    return stage5Outcome.result;
  }

  const { decision: stage5Decision, usage: stage5Usage } = stage5Outcome;

  const stage5Stop = await reviewStageAndMaybeStop({
    runId,
    task,
    controlPanelSettings,
    stage: 5,
    decision: stage5Decision,
    usage: stage5Usage,
    stagesCompleted: 5,
    routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
  });

  if (stage5Stop) {
    return stage5Stop;
  }

  let finalRequestRaw;

  try {
    finalRequestRaw = JSON.parse(stage5Decision.requestJson);
  } catch (error) {
    const consult = await helpRouterRecoverFromError({
      task,
      controlPanelSettings,
      runId,
      stage: 5,
      routeSoFar: { modelId: model._id.toString(), apiId: api._id.toString() },
      sections: stage5Sections,
      errorType: "error",
      errorMessage: "Router produced invalid JSON in requestJson.",
      errorDetails: error.message,
      mustAbandon: true,
    });

    await updateRouterRun(runId, {
      stage: 5,
      status: "blocked",
      ticketIds: consult.tickets?.map((ticket) => ticket._id) || [],
    });

    return { status: "blocked", runId, tickets: consult.tickets };
  }

  const isImagesFamily = api.apiFamily === "images";

  const finalRequestFields = {};

  if (isImagesFamily) {
    Object.entries(IMAGES_FIELD_MAP).forEach(([sourceField, targetField]) => {
      if (Object.prototype.hasOwnProperty.call(finalRequestRaw, sourceField)) {
        finalRequestFields[targetField] = finalRequestRaw[sourceField];
      }
    });
  } else {
    RESPONSES_FINAL_REQUEST_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(finalRequestRaw, field)) {
        finalRequestFields[field] = finalRequestRaw[field];
      }
    });
  }

  await updateRouterRun(runId, { stage: "executing", finalRequest: finalRequestFields });


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
  let workerResult = await executeRoute({
    runId,
    task,
    model,
    apiFamily: isImagesFamily ? "images" : "responses",
    finalRequestFields,
    attachments,
  });

  if (workerResult.status === "failed") {
    const executionSections = [
      { label: "SELECTED MODEL", body: `_id: ${model._id.toString()}\nname: ${model.name}` },
      { label: "SELECTED API", body: `_id: ${api._id.toString()}\nname: ${api.name}` },
      { label: "ASSEMBLED REQUEST THAT FAILED", body: JSON.stringify(finalRequestFields, null, 2) },
    ];

    const routeSoFar = { modelId: model._id.toString(), apiId: api._id.toString(), finalRequestFields };

    let consult = await helpRouterRecoverFromError({
      task,
      controlPanelSettings,
      runId,
      stage: "executing",
      routeSoFar,
      sections: executionSections,
      errorType: "error",
      errorMessage: "Worker execution failed.",
      errorDetails: workerResult.errorMessage,
      mustAbandon: false,
    });

    await appendRouterRunTrace(runId, {
      stage: "executing",
      maintenanceConsult: {
        errorMessage: workerResult.errorMessage,
        outcome: consult.outcome,
      },
    });

    /*
     * A "fix" this late can only be applied by
     * trying execution again — there is no
     * request-shape repair the server can do
     * automatically from free-text guidance, so a
     * retry here means one more attempt of the
     * exact same assembled request (useful for a
     * transient failure), not a re-assembly.
     */
    if (consult.outcome === "retry") {
      workerResult = await executeRoute({
        runId,
        task,
        model,
        apiFamily: isImagesFamily ? "images" : "responses",
        finalRequestFields,
        attachments,
      });

      if (workerResult.status === "failed") {
        consult = await helpRouterRecoverFromError({
          task,
          controlPanelSettings,
          runId,
          stage: "executing",
          routeSoFar,
          sections: executionSections,
          errorType: "error",
          errorMessage: "Worker execution failed again after a retry.",
          errorDetails: workerResult.errorMessage,
          mustAbandon: true,
          priorLog: consult.log,
        });
      }
    }

    if (workerResult.status === "failed") {
      await updateRouterRun(runId, {
        stage: "executing",
        status: "blocked",
        ticketIds: consult.tickets?.map((ticket) => ticket._id) || [],
      });

      return { status: "blocked", runId, tickets: consult.tickets };
    }
  }

  await updateRouterRun(runId, { stage: "completed", status: "completed" });

  return { status: "completed", runId, response: workerResult.response };
}


export { runRouter };
