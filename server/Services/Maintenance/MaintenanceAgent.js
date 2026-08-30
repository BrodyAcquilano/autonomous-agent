import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getMaintenanceAgentProfile,
} from "../../Runtime/Agents.js";

import {
  getAllModels,
  getModelById,
  insertModel,
} from "../MongoDB/Models.js";

import {
  getAllApis,
  getApiById,
  insertApi,
} from "../MongoDB/Apis.js";

import {
  getAllTools,
  getToolById,
  insertTool,
} from "../MongoDB/Tools.js";

import {
  getAllCapabilities,
  insertCapability,
} from "../MongoDB/Capabilities.js";

import {
  createMaintenanceLog,
  getAllUnprocessedLogs,
  markLogProcessed,
} from "../MongoDB/MaintenanceLogs.js";

import {
  createMaintenanceTicket,
} from "../MongoDB/MaintenanceTickets.js";

import {
  getStageTextFormat,
} from "../Router/RouterSchemas.js";

import {
  MAINTENANCE_DECISION_SCHEMA,
  MODEL_PATCH_SCHEMA,
  API_PATCH_SCHEMA,
  TOOL_PATCH_SCHEMA,
  CAPABILITY_PATCH_SCHEMA,
} from "./MaintenanceSchemas.js";


/*
 * Same fixed model/tool convention as the
 * Router and Analyst — a permanent, always-on
 * agent identity, not something the console's
 * per-request model picker touches.
 */
const MAINTENANCE_MODEL = "gpt-5.6-terra";

const MAINTENANCE_TOOLS = [{ type: "web_search" }];

/*
 * A sweep processes at most this many
 * unprocessed logs per call, so a single
 * request (or a single cron tick) can never run
 * away with an unbounded number of AI calls just
 * because a backlog built up.
 */
const MAX_LOGS_PER_SWEEP = 5;


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
 * The same funnel the Router itself uses, given
 * to the Maintenance agent as reference material
 * for whichever incident/question it is
 * investigating this call. Platforms is omitted
 * for now — there is no Platforms collection/
 * service built yet, and the agent's own prompt
 * already treats that level as "usually a
 * formality" while there is only one platform.
 */
async function buildCapabilitiesBrainSnapshot() {
  const [models, apis, tools, capabilities] = await Promise.all([
    getAllModels(),
    getAllApis(),
    getAllTools(),
    getAllCapabilities(),
  ]);

  return [
    { label: "MODELS", body: formatDocsForPrompt(models) },
    { label: "APIS", body: formatDocsForPrompt(apis) },
    { label: "TOOLS", body: formatDocsForPrompt(tools) },
    { label: "CAPABILITIES", body: formatDocsForPrompt(capabilities) },
  ];
}


function buildIncidentInput({ taskLabel, incidentText, brainSections }) {
  const content = [
    {
      type: "input_text",
      text: `=== TASK ===\n${taskLabel}\n\n=== INCIDENT ===\n${incidentText}`,
    },
    ...brainSections.map((section) => ({
      type: "input_text",
      text: `=== ${section.label} ===\n${section.body}`,
    })),
  ];

  return [{ role: "user", content }];
}


async function callMaintenanceAgent({ taskLabel, incidentText, brainSections, instructions }) {
  const input = buildIncidentInput({ taskLabel, incidentText, brainSections });

  const response = await createResponse({
    model: MAINTENANCE_MODEL,
    input,
    instructions,
    reasoning: { effort: "medium", mode: "standard" },
    max_output_tokens: 8000,
    tools: MAINTENANCE_TOOLS,
    text: getStageTextFormat("maintenance_decision", MAINTENANCE_DECISION_SCHEMA),
  });

  const outputText = typeof response.output_text === "string" ? response.output_text : "";

  try {
    return JSON.parse(outputText).result;
  } catch (error) {
    throw new Error(`Maintenance agent returned unparseable output: ${error.message}`, { cause: error });
  }
}


/*
 * Turns one triaged incident into a maintenance
 * ticket. `loggedBy` is whoever's incident this
 * originally was (router/analyst/maintenance
 * itself for a self-found sweep result) — the
 * field the frontend actually filters tickets
 * by, since "who filed the paperwork" is always
 * "maintenance" now and isn't useful to filter
 * on. `state` intentionally carries only what a
 * literal restart needs (task + control panel
 * settings) — there is no resumable stage state
 * anymore, a restart always re-runs the Router
 * from Stage 1 with Maintenance's guidance as
 * extra context.
 */
async function fileTicketFromDecision({ decision, loggedBy, sourceLogId, task, controlPanelSettings, runId, context }) {
  const ticket = await createMaintenanceTicket("maintenance", {
    loggedBy,
    sourceLogId,
    type: decision.ticketType || "request",
    message: decision.summary,
    details: decision.reasoning,
    recommendedAction: {
      actionType: decision.actionType,
      summary: decision.summary,
      instructions: decision.instructions,
    },
    task,
    context: context || {},
    state: {
      runId: runId || null,
      task,
      controlPanelSettings: controlPanelSettings || {},
    },
  });

  return ticket;
}


/*
 * Investigates every currently-unprocessed
 * incident log (router/analyst so far, any
 * future logging agent automatically included)
 * up to MAX_LOGS_PER_SWEEP per call, deciding
 * per incident whether it is worth a ticket.
 */
async function sweepUnprocessedLogs(instructions, brainSections) {
  const logs = (await getAllUnprocessedLogs()).slice(0, MAX_LOGS_PER_SWEEP);

  const results = [];

  for (const log of logs) {
    const incidentText = [
      `originally logged by: ${log.agentName}`,
      `type: ${log.type}`,
      `message: ${log.message}`,
      `details: ${log.details}`,
      `stage: ${log.stage ?? "—"}`,
      `task: ${log.task}`,
    ].join("\n");

    let decision;

    try {
      decision = await callMaintenanceAgent({
        taskLabel: `Investigate an incident logged by the ${log.agentName} agent and decide whether it should become a ticket.`,
        incidentText,
        brainSections,
        instructions,
      });
    } catch (error) {
      results.push({ log, error: error.message });
      continue;
    }

    if (!decision.shouldFileTicket) {
      await markLogProcessed(log.agentName, log._id.toString(), null);
      results.push({ log, decision, ticket: null });
      continue;
    }

    const ticket = await fileTicketFromDecision({
      decision,
      loggedBy: log.agentName,
      sourceLogId: log._id,
      task: log.task,
      controlPanelSettings: log.state?.controlPanelSettings,
      runId: log.state?.runId,
      context: log.context,
    });

    await markLogProcessed(log.agentName, log._id.toString(), ticket._id.toString());

    results.push({ log, decision, ticket });
  }

  return results;
}


/*
 * A human-directed research question, asked
 * directly from the Maintenance portal's own
 * command shell (or, later, a cron tick with no
 * specific question). Always investigated first
 * and takes priority over the background log
 * sweep, per the agent's own profile.
 */
async function investigateFocus(focus, instructions, brainSections) {
  const decision = await callMaintenanceAgent({
    taskLabel: focus,
    incidentText: `A human asked Maintenance to look into: ${focus}`,
    brainSections,
    instructions,
  });

  if (!decision.shouldFileTicket) {
    return { decision, ticket: null };
  }

  const ticket = await fileTicketFromDecision({
    decision,
    loggedBy: "maintenance",
    sourceLogId: null,
    task: focus,
    controlPanelSettings: {},
    runId: null,
    context: {},
  });

  return { decision, ticket };
}


/*
 * The Router and the Temp Worker both reach this
 * same live consult whenever they run into
 * something they cannot get past on their own —
 * the Router by its own decision to report an
 * error, the Worker when the model it was handed
 * actually failed to execute the resolved route
 * (e.g. the Capabilities Brain claimed a tool was
 * available and it wasn't). This is the server
 * (never the Router or Worker themselves — neither
 * one contacts Maintenance directly or knows it
 * exists) asking Maintenance for a live,
 * time-sensitive second opinion, using only the
 * exact reference material already in hand for
 * that point in the run — not a full Capabilities
 * Brain sweep-style scan.
 *
 * `reportedBy` names whichever agent's own
 * decision/failure this is a record of ("router" or
 * "worker") — every call permanently records it as
 * a log in that agent's own collection first, the
 * same way incidents were always logged, regardless
 * of what happens next. `priorLog` (the previous
 * call's own `{ id, error }`) is only ever passed
 * back in on the ONE follow-up call that happens
 * after a suggested fix was tried and failed again
 * — in that case no second log is written for the
 * original report (it already covers it), but the
 * fact that Maintenance's OWN suggested fix also
 * failed becomes its own separate record: a second
 * log in maintenance.maintenance, and a second
 * ticket (`loggedBy: "maintenance"`) alongside the
 * first. That is deliberate — a fix that didn't
 * work is a distinct failure from the original one,
 * and both need their own ticket for a human to see
 * as two separate things to fix, not one.
 *
 * `actionType: "self_fixed"` or `"none"` both mean
 * "there is a way forward" — when a retry is even
 * offered (`allowRetry`), the server treats that as
 * a fix and retries the same stage with
 * `instructions` as extra guidance. Every other
 * actionType means the task cannot proceed right
 * now, and Maintenance itself files the ticket(s)
 * (neither the Router nor the Worker ever does)
 * before the server ends the run. A Worker execution
 * failure never offers a retry at all
 * (`allowRetry: false`) — there is no textual fix
 * Maintenance could give the Worker to try again
 * with; the actual remedy is a Capabilities Brain
 * patch a human has to approve first (see
 * `applyCapabilitiesBrainPatch` below), which only
 * happens on a later restart. `mustAbandon` is set
 * by the server only on the one allowed retry's own
 * failure — a bounded safety net, not something left
 * to chance — and forces the abandon outcome
 * regardless of what Maintenance answers, so a run
 * can never loop indefinitely between the Router and
 * Maintenance.
 */
async function helpRecoverFromError({
  task,
  controlPanelSettings,
  runId,
  stage,
  routeSoFar,
  sections,
  errorType,
  errorMessage,
  errorDetails,
  reportedBy = "router",
  allowRetry = true,
  mustAbandon = false,
  priorLog = null,
}) {
  const agent = getMaintenanceAgentProfile();

  if (!agent) {
    throw new Error(
      'Maintenance agent is not configured. Add an agent named "maintenance" to the agents collection.',
    );
  }

  let originalLogId = priorLog?.id || null;
  const originalError = priorLog?.error || { type: errorType, message: errorMessage, details: errorDetails };

  if (!originalLogId) {
    const originalLog = await createMaintenanceLog(reportedBy, {
      type: errorType,
      message: errorMessage,
      details: errorDetails,
      stage,
      task,
      context: routeSoFar,
      state: {
        runId,
        task,
        controlPanelSettings: controlPanelSettings || {},
      },
    });

    originalLogId = originalLog._id.toString();
  }

  const incidentText = [
    `The ${reportedBy === "worker" ? "Temp Worker" : "Router"} agent could not proceed at stage "${stage}" and reported an error.`,
    `errorType: ${errorType}`,
    `errorMessage: ${errorMessage}`,
    `errorDetails: ${errorDetails}`,
    mustAbandon
      ? "NOTE: a fix you already gave for this exact stage was tried and the stage failed again with the same kind of problem. Do not suggest another retry — conclude this cannot be resolved right now (actionType other than \"self_fixed\"/\"none\") so a ticket can be filed."
      : !allowRetry
        ? "NOTE: this is a Temp Worker execution failure, not a Router decision -- there is nothing to retry inline right now. Even if you believe you know the fix (e.g. the Capabilities Brain needs a new model/API/tool/capability added), still choose the actionType that best names the gap (add_model/add_api/add_tool/add_capability/reconfigure_existing/abandon) rather than self_fixed/none, since applying it requires a human-approved Capabilities Brain patch on a later restart, not an immediate retry."
        : "If you can identify a fix the Router should try (a different selection, a corrected understanding of what's available), say so as actionType \"self_fixed\" or \"none\" with clear instructions — the Router will be given exactly what you write in `instructions` and asked to try this stage again. Otherwise, choose the actionType that best describes what's actually missing or wrong.",
  ].join("\n");

  const decision = await callMaintenanceAgent({
    taskLabel: `Live consult: the ${reportedBy === "worker" ? "Temp Worker" : "Router"} needs help recovering from an error at stage "${stage}" of an in-progress task.`,
    incidentText,
    brainSections: sections,
    instructions: agent.contentMarkdown,
  });

  const canRetry =
    allowRetry &&
    !mustAbandon &&
    (decision.actionType === "self_fixed" || decision.actionType === "none");

  if (canRetry) {
    return {
      outcome: "retry",
      fixInstructions: decision.instructions || decision.reasoning,
      decision,
      log: { id: originalLogId, error: originalError },
    };
  }

  /*
   * Ending the task always needs a human-visible
   * ticket, regardless of `shouldFileTicket` — a
   * silent abandonment with nothing to show for it
   * would leave the person who made the request
   * with no explanation at all. This first ticket is
   * always about the original report, whether or not
   * a fix was ever attempted.
   */
  const originalTicket = await createMaintenanceTicket("maintenance", {
    loggedBy: reportedBy,
    sourceLogId: originalLogId,
    type: originalError.type,
    message: originalError.message,
    details: originalError.details,
    recommendedAction: {
      actionType: decision.actionType,
      summary: decision.summary,
      instructions: decision.instructions,
    },
    task,
    context: routeSoFar,
    state: {
      runId,
      task,
      controlPanelSettings: controlPanelSettings || {},
    },
  });

  await markLogProcessed(reportedBy, originalLogId, originalTicket._id.toString());

  const tickets = [originalTicket];

  /*
   * priorLog is only ever set on the follow-up call
   * after a suggested fix was tried and failed — so
   * reaching here with it present means Maintenance's
   * own recommendation didn't work either. That is a
   * second, distinct failure with its own record.
   */
  if (priorLog) {
    const maintenanceLog = await createMaintenanceLog("maintenance", {
      type: decision.ticketType || "error",
      message: "A fix Maintenance suggested did not resolve the issue.",
      details: decision.reasoning,
      stage,
      task,
      context: routeSoFar,
      state: {
        runId,
        task,
        controlPanelSettings: controlPanelSettings || {},
      },
    });

    const maintenanceTicket = await createMaintenanceTicket("maintenance", {
      loggedBy: "maintenance",
      sourceLogId: maintenanceLog._id,
      type: decision.ticketType || "error",
      message: "A fix Maintenance suggested did not resolve the issue.",
      details: decision.reasoning,
      recommendedAction: {
        actionType: decision.actionType,
        summary: decision.summary,
        instructions: decision.instructions,
      },
      task,
      context: routeSoFar,
      state: {
        runId,
        task,
        controlPanelSettings: controlPanelSettings || {},
      },
    });

    await markLogProcessed("maintenance", maintenanceLog._id.toString(), maintenanceTicket._id.toString());

    tickets.push(maintenanceTicket);
  }

  return { outcome: "abandon", tickets, decision };
}


/* --------------------------------
   CAPABILITIES BRAIN PATCH
-------------------------------- */

const PATCH_ACTION_TYPES = {
  add_model: "models",
  add_api: "apis",
  add_tool: "tools",
  add_capability: "capabilities",
};

const LAYER_SEQUENCE = ["models", "apis", "tools", "capabilities"];

const PATCH_SCHEMA_BY_LAYER = {
  models: MODEL_PATCH_SCHEMA,
  apis: API_PATCH_SCHEMA,
  tools: TOOL_PATCH_SCHEMA,
  capabilities: CAPABILITY_PATCH_SCHEMA,
};


/*
 * One AI call for one layer of the patch. Given
 * only what's actually relevant at that layer —
 * the parent model/api already resolved (if any),
 * and a handful of existing sibling documents at
 * this same layer as a structural/stylistic
 * reference — not the whole Capabilities Brain.
 * web_search is available so a genuinely new model
 * or API gets accurately researched rather than
 * guessed at.
 */
async function runPatchLayer({ layer, ticket, currentModel, currentApi, instructions }) {
  const sections = [
    {
      label: "APPROVED MAINTENANCE REQUEST",
      body: [
        `original problem: ${ticket.message}`,
        `details: ${ticket.details}`,
        `maintenance's own summary: ${ticket.recommendedAction?.summary || ""}`,
        `maintenance's own instructions (what to add, left by its earlier self): ${ticket.recommendedAction?.instructions || ""}`,
      ].join("\n"),
    },
  ];

  if (currentModel) {
    sections.push({
      label: "PARENT MODEL",
      body: `_id: ${currentModel._id.toString()}\nname: ${currentModel.name}\n\n${currentModel.contentMarkdown}`,
    });
  }

  if (currentApi) {
    sections.push({
      label: "PARENT API",
      body: `_id: ${currentApi._id.toString()}\nname: ${currentApi.name}\n\n${currentApi.contentMarkdown}`,
    });
  }

  let existingSiblingDocs = [];

  if (layer === "models") {
    existingSiblingDocs = await getAllModels();
  } else if (layer === "apis") {
    existingSiblingDocs = currentModel
      ? await getAllApis({ model: currentModel._id.toString() })
      : await getAllApis();
  } else if (layer === "tools" && currentModel && currentApi) {
    existingSiblingDocs = await getAllTools({
      model: currentModel._id.toString(),
      api: currentApi._id.toString(),
    });
  }

  sections.push({
    label: `EXISTING ${layer.toUpperCase()} DOCUMENTS (structural/stylistic reference only — do not duplicate one of these)`,
    body: formatDocsForPrompt(existingSiblingDocs.slice(0, 5)),
  });

  const input = buildIncidentInput({
    taskLabel: `Write the "${layer}" layer of an already human-approved Capabilities Brain patch.`,
    incidentText: `A human has already approved this request and configured whatever real external resources it needs (an Azure deployment, credentials, etc., outside this system). Your job now is only to write the "${layer}" layer of MongoDB documentation for it — later layers, if any, are handled in their own separate call.`,
    brainSections: sections,
  });

  const response = await createResponse({
    model: MAINTENANCE_MODEL,
    input,
    instructions,
    reasoning: { effort: "medium", mode: "standard" },
    max_output_tokens: 12000,
    tools: MAINTENANCE_TOOLS,
    text: getStageTextFormat(`maintenance_patch_${layer}`, PATCH_SCHEMA_BY_LAYER[layer]),
  });

  const outputText = typeof response.output_text === "string" ? response.output_text : "";

  try {
    return JSON.parse(outputText).result;
  } catch (error) {
    throw new Error(`Maintenance agent returned unparseable patch output at layer "${layer}": ${error.message}`, { cause: error });
  }
}


/*
 * Applies an already human-approved Capabilities
 * Brain patch, triggered only from a ticket
 * restart (see runRouter() in RouterAgent.js) —
 * never automatically, and never at ticket-filing
 * time. The human approves by doing whatever real
 * external setup the ticket described (a new Azure
 * deployment, an API key, a new .env var) and then
 * hitting Restart Process; that click is the
 * approval, not a separate confirmation step.
 *
 * Starts at whichever layer the ticket's own
 * `recommendedAction.actionType` names (a new
 * model starts at "models" and may cascade all the
 * way to "capabilities"; a request for just a new
 * tool on an existing model+API starts at "tools"),
 * resolving the parent model/API to attach to from
 * the ticket's own `context` (the Router's
 * routeSoFar at the moment it originally failed) —
 * Maintenance never has to guess which model an
 * "add a tool" request is about. Each layer is one
 * separate, narrowly-scoped AI call
 * (see runPatchLayer), so nothing here ever loads
 * the whole Capabilities Brain at once. Stops as
 * soon as a layer returns no new documents, or
 * after `capabilities` (there is nothing beneath
 * it), or when a layer itself says
 * `continueToNextLayer: false`.
 *
 * A genuinely new model still needs a human to add
 * its real Azure deployment, the matching `.env`
 * variable, and a new case in `getAzureConfig()`
 * (`server/Services/Azure/OpenAIResponses.js`) —
 * none of that is a database document, so this
 * cannot do it. The ticket's own instructions are
 * expected to say so; this only ever writes
 * MongoDB documentation, never source code.
 */
async function applyCapabilitiesBrainPatch(ticket) {
  const agent = getMaintenanceAgentProfile();

  if (!agent) {
    throw new Error(
      'Maintenance agent is not configured. Add an agent named "maintenance" to the agents collection.',
    );
  }

  const actionType = ticket.recommendedAction?.actionType;
  const startLayer = PATCH_ACTION_TYPES[actionType];

  if (!startLayer) {
    return {
      applied: false,
      reason: `actionType "${actionType}" does not describe a Capabilities Brain gap.`,
    };
  }

  let currentModel = ticket.context?.modelId ? await getModelById(ticket.context.modelId) : null;
  let currentApi = ticket.context?.apiId ? await getApiById(ticket.context.apiId) : null;
  let currentTool = ticket.context?.toolIds?.length ? await getToolById(ticket.context.toolIds[0]) : null;

  const created = { models: [], apis: [], tools: [], capabilities: [] };

  const startIndex = LAYER_SEQUENCE.indexOf(startLayer);

  for (let i = startIndex; i < LAYER_SEQUENCE.length; i += 1) {
    const layer = LAYER_SEQUENCE[i];

    const { newDocuments, continueToNextLayer } = await runPatchLayer({
      layer,
      ticket,
      currentModel,
      currentApi,
      instructions: agent.contentMarkdown,
    });

    if (!newDocuments.length) {
      break;
    }

    if (layer === "models") {
      for (const doc of newDocuments) {
        const inserted = await insertModel({
          name: doc.name,
          displayName: doc.displayName,
          provider: doc.provider,
          modelVersion: doc.modelVersion,
          lifecycle: doc.lifecycle,
          deployment: {
            envVar: doc.envVar,
            expectedDeploymentName: doc.expectedDeploymentName,
            deploymentType: doc.deploymentType,
          },
          contextWindow: { total: null, maxInput: null, maxOutput: doc.contextWindowNote },
          contentMarkdown: doc.contentMarkdown,
          category: "UNCATEGORIZED",
          description: doc.displayName,
          imagePath: "",
          providerLabel: doc.provider,
        });

        created.models.push(inserted);
      }

      currentModel = created.models[created.models.length - 1];
    } else if (layer === "apis") {
      if (!currentModel) {
        break;
      }

      for (const doc of newDocuments) {
        const inserted = await insertApi({
          name: doc.name,
          displayName: doc.displayName,
          model: currentModel._id,
          modelName: currentModel.name,
          apiFamily: doc.apiFamily,
          clientMethod: doc.clientMethod,
          contentMarkdown: doc.contentMarkdown,
        });

        created.apis.push(inserted);
      }

      currentApi = created.apis[created.apis.length - 1];
    } else if (layer === "tools") {
      if (!currentModel || !currentApi) {
        break;
      }

      for (const doc of newDocuments) {
        const inserted = await insertTool({
          name: doc.name,
          displayName: doc.displayName,
          model: currentModel._id,
          modelName: currentModel.name,
          api: currentApi._id,
          apiName: currentApi.name,
          contentMarkdown: doc.contentMarkdown,
        });

        created.tools.push(inserted);
      }

      currentTool = created.tools[created.tools.length - 1];
    } else if (layer === "capabilities") {
      const tool = created.tools[created.tools.length - 1] || currentTool;

      if (!tool) {
        break;
      }

      for (const doc of newDocuments) {
        let requestTemplate;

        try {
          requestTemplate = JSON.parse(doc.requestTemplateJson);
        } catch {
          requestTemplate = {};
        }

        const inserted = await insertCapability(
          {
            name: doc.name,
            displayName: doc.displayName,
            tool: tool._id,
            toolName: tool.name,
            description: doc.description,
            requestTemplate,
            contentMarkdown: doc.contentMarkdown,
          },
          "maintenance-authored",
        );

        created.capabilities.push(inserted);
      }
    }

    if (!continueToNextLayer) {
      break;
    }
  }

  return { applied: true, created };
}


/*
 * Main entry point. A `focus` question always
 * runs first and alone (it is the priority);
 * with no focus, this sweeps whatever unprocessed
 * incident logs currently exist. If there is
 * neither a focus nor any unprocessed logs, this
 * runs one broad, undirected audit pass over the
 * whole Capabilities Brain, matching the agent's
 * own documented "general sweep" behavior.
 */
async function runMaintenanceSweep({ focus } = {}) {
  const agent = getMaintenanceAgentProfile();

  if (!agent) {
    throw new Error(
      'Maintenance agent is not configured. Add an agent named "maintenance" to the agents collection.',
    );
  }

  const instructions = agent.contentMarkdown;
  const brainSections = await buildCapabilitiesBrainSnapshot();

  if (typeof focus === "string" && focus.trim()) {
    const { decision, ticket } = await investigateFocus(focus.trim(), instructions, brainSections);

    return {
      mode: "focus",
      focus: focus.trim(),
      decision,
      ticket,
      logsProcessed: 0,
      ticketsFiled: ticket ? 1 : 0,
    };
  }

  const sweepResults = await sweepUnprocessedLogs(instructions, brainSections);

  if (sweepResults.length) {
    return {
      mode: "sweep",
      results: sweepResults,
      logsProcessed: sweepResults.length,
      ticketsFiled: sweepResults.filter((item) => item.ticket).length,
    };
  }

  const { decision, ticket } = await investigateFocus(
    "No open incidents are waiting for review. Run a general audit of the Capabilities Brain for anything stale, missing, or inconsistent.",
    instructions,
    brainSections,
  );

  return {
    mode: "general_audit",
    decision,
    ticket,
    logsProcessed: 0,
    ticketsFiled: ticket ? 1 : 0,
  };
}


export { runMaintenanceSweep, helpRecoverFromError, applyCapabilitiesBrainPatch };
