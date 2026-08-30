import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getMaintenanceAgentProfile,
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
 * The third way Maintenance is ever invoked: a
 * Router run in progress just decided it cannot
 * make a stage's decision on its own and reported
 * an error. This is the server (never the Router
 * itself — the Router only ever reports its own
 * error and has no idea Maintenance exists) asking
 * Maintenance for a live, time-sensitive second
 * opinion, using only the exact reference material
 * the Router itself had loaded for that stage —
 * not the full Capabilities Brain sweep-style scan
 * — since a live user request is waiting on this
 * answer.
 *
 * Every call permanently records the Router's own
 * error as a log in maintenance.router, the same
 * way Router/Analyst incidents were always logged
 * — Maintenance taking the call doesn't change
 * whose failure this is a record of. `priorLog`
 * (the previous call's own `{ id, error }`) is
 * only ever passed back in on the ONE follow-up
 * call that happens after a suggested fix was
 * tried and failed again — in that case no second
 * router log is written (the original one already
 * covers it), but the fact that Maintenance's OWN
 * suggested fix also failed becomes its own
 * separate record: a second log in
 * maintenance.maintenance, and a second ticket
 * (`loggedBy: "maintenance"`) alongside the first.
 * That is deliberate — a fix that didn't work is a
 * distinct failure from the Router's original one,
 * and both need their own ticket for a human to
 * see as two separate things to fix, not one.
 *
 * `actionType: "self_fixed"` or `"none"` both mean
 * "there is a way forward" — the server treats
 * that as a fix and retries the Router at the same
 * stage with `instructions` as extra guidance.
 * Every other actionType means the task cannot
 * proceed right now, and Maintenance itself files
 * the ticket(s) (the Router never does) before the
 * server ends the run. `mustAbandon` is set by the
 * server only on the one allowed retry's own
 * failure — a bounded safety net, not something
 * left to chance — and forces the abandon outcome
 * regardless of what Maintenance answers, so a run
 * can never loop indefinitely between the Router
 * and Maintenance.
 */
async function helpRouterRecoverFromError({
  task,
  controlPanelSettings,
  runId,
  stage,
  routeSoFar,
  sections,
  errorType,
  errorMessage,
  errorDetails,
  mustAbandon = false,
  priorLog = null,
}) {
  const agent = getMaintenanceAgentProfile();

  if (!agent) {
    throw new Error(
      'Maintenance agent is not configured. Add an agent named "maintenance" to the agents collection.',
    );
  }

  let routerLogId = priorLog?.id || null;
  const originalError = priorLog?.error || { type: errorType, message: errorMessage, details: errorDetails };

  if (!routerLogId) {
    const routerLog = await createMaintenanceLog("router", {
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

    routerLogId = routerLog._id.toString();
  }

  const incidentText = [
    `The Router agent's own decision was that it could not proceed at stage "${stage}" and it reported an error.`,
    `errorType: ${errorType}`,
    `errorMessage: ${errorMessage}`,
    `errorDetails: ${errorDetails}`,
    mustAbandon
      ? "NOTE: a fix you already gave for this exact stage was tried and the stage failed again with the same kind of problem. Do not suggest another retry — conclude this cannot be resolved right now (actionType other than \"self_fixed\"/\"none\") so a ticket can be filed."
      : "If you can identify a fix the Router should try (a different selection, a corrected understanding of what's available), say so as actionType \"self_fixed\" or \"none\" with clear instructions — the Router will be given exactly what you write in `instructions` and asked to try this stage again. Otherwise, choose the actionType that best describes what's actually missing or wrong.",
  ].join("\n");

  const decision = await callMaintenanceAgent({
    taskLabel: `Live consult: the Router needs help recovering from an error at stage "${stage}" of an in-progress task.`,
    incidentText,
    brainSections: sections,
    instructions: agent.contentMarkdown,
  });

  const canRetry =
    !mustAbandon &&
    (decision.actionType === "self_fixed" || decision.actionType === "none");

  if (canRetry) {
    return {
      outcome: "retry",
      fixInstructions: decision.instructions || decision.reasoning,
      decision,
      log: { id: routerLogId, error: originalError },
    };
  }

  /*
   * Ending the task always needs a human-visible
   * ticket, regardless of `shouldFileTicket` — a
   * silent abandonment with nothing to show for it
   * would leave the person who made the request
   * with no explanation at all. This first ticket
   * is always about the Router's own original
   * error, whether or not a fix was ever attempted.
   */
  const routerTicket = await createMaintenanceTicket("maintenance", {
    loggedBy: "router",
    sourceLogId: routerLogId,
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

  await markLogProcessed("router", routerLogId, routerTicket._id.toString());

  const tickets = [routerTicket];

  /*
   * priorLog is only ever set on the follow-up
   * call after a suggested fix was tried and
   * failed — so reaching here with it present
   * means Maintenance's own recommendation didn't
   * work either. That is a second, distinct
   * failure with its own record.
   */
  if (priorLog) {
    const maintenanceLog = await createMaintenanceLog("maintenance", {
      type: decision.ticketType || "error",
      message: "A fix Maintenance suggested for the Router did not resolve the issue.",
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
      message: "A fix Maintenance suggested for the Router did not resolve the issue.",
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


export { runMaintenanceSweep, helpRouterRecoverFromError };
