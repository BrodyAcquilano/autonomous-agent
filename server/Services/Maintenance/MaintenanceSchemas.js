/*
 * Structured-output schema for the Maintenance
 * agent's triage decision. One incident (an
 * unprocessed log entry from another agent, a
 * human's focused question, or something found
 * during a general sweep) in, one decision out.
 *
 * `actionType` is the Maintenance agent's actual
 * recommendation, not just a category label:
 *
 * - "add_model" / "add_api" / "add_tool" / "add_capability":
 *   the Capabilities Brain is missing something
 *   the task needed; a human should add it.
 * - "reconfigure_existing": nothing needs adding —
 *   an existing model/api/tool could have done the
 *   job with different configuration or a
 *   different selection than the Router made.
 * - "self_fixed": Maintenance found and can
 *   describe a documentation inconsistency a
 *   human can quickly correct, after which the
 *   same task should simply be restarted.
 * - "abandon": the task is not achievable with
 *   any realistic near-term fix (e.g. it depends
 *   on a discontinued model/capability) and
 *   should not be retried.
 * - "none": nothing worth flagging — the incident
 *   is dismissed without a ticket.
 */
const MAINTENANCE_DECISION_SCHEMA = {
  type: "object",

  properties: {
    result: {
      type: "object",

      properties: {
        shouldFileTicket: {
          type: "boolean",
        },

        actionType: {
          type: "string",
          enum: [
            "add_model",
            "add_api",
            "add_tool",
            "add_capability",
            "reconfigure_existing",
            "self_fixed",
            "abandon",
            "none",
          ],
        },

        ticketType: {
          type: "string",
          enum: ["error", "request", ""],
        },

        summary: {
          type: "string",
        },

        instructions: {
          type: "string",
        },

        reasoning: {
          type: "string",
        },
      },

      required: [
        "shouldFileTicket",
        "actionType",
        "ticketType",
        "summary",
        "instructions",
        "reasoning",
      ],

      additionalProperties: false,
    },
  },

  required: ["result"],

  additionalProperties: false,
};


/*
 * Structured-output schemas for one LAYER of a
 * Capabilities Brain patch (see
 * applyCapabilitiesBrainPatch in
 * MaintenanceAgent.js). A patch is a sequence of
 * calls, one per layer (models -> apis -> tools ->
 * capabilities), each returning zero or more new
 * documents for that layer plus whether the patch
 * should keep going to the next layer -- a new
 * model that needs no tools of its own, for
 * example, stops after apis. `newDocuments` empty
 * also stops the sequence, regardless of
 * `continueToNextLayer`.
 *
 * These are deliberately narrower than a real
 * Model/API/Tool document's full schema (no
 * pricing, rate limits, retirement dates, category,
 * or image path) -- Maintenance's job here is to
 * get the FUNCTIONAL brain correct (what the Router
 * needs to select and call it), not to perfect
 * cosmetic/display fields a human can refine later.
 * `contentMarkdown` is still the real, complete
 * document for each layer, same as everywhere else
 * in this system -- an agent's entire knowledge
 * lives in that one field, not scattered structured
 * properties.
 */

function wrapPatchLayerResult(itemSchema) {
  return {
    type: "object",

    properties: {
      result: {
        type: "object",

        properties: {
          newDocuments: {
            type: "array",
            items: itemSchema,
          },

          continueToNextLayer: {
            type: "boolean",
          },

          reasoning: {
            type: "string",
          },
        },

        required: ["newDocuments", "continueToNextLayer", "reasoning"],

        additionalProperties: false,
      },
    },

    required: ["result"],

    additionalProperties: false,
  };
}


const MODEL_PATCH_SCHEMA = wrapPatchLayerResult({
  type: "object",

  properties: {
    name: { type: "string" },
    displayName: { type: "string" },
    provider: { type: "string" },
    modelVersion: { type: "string" },
    lifecycle: { type: "string" },
    envVar: { type: "string" },
    expectedDeploymentName: { type: "string" },
    deploymentType: { type: "string" },
    contextWindowNote: { type: "string" },
    contentMarkdown: { type: "string" },
  },

  required: [
    "name",
    "displayName",
    "provider",
    "modelVersion",
    "lifecycle",
    "envVar",
    "expectedDeploymentName",
    "deploymentType",
    "contextWindowNote",
    "contentMarkdown",
  ],

  additionalProperties: false,
});


const API_PATCH_SCHEMA = wrapPatchLayerResult({
  type: "object",

  properties: {
    name: { type: "string" },
    displayName: { type: "string" },
    apiFamily: { type: "string", enum: ["responses", "images"] },
    clientMethod: { type: "string" },
    contentMarkdown: { type: "string" },
  },

  required: ["name", "displayName", "apiFamily", "clientMethod", "contentMarkdown"],

  additionalProperties: false,
});


const TOOL_PATCH_SCHEMA = wrapPatchLayerResult({
  type: "object",

  properties: {
    name: { type: "string" },
    displayName: { type: "string" },
    contentMarkdown: { type: "string" },
  },

  required: ["name", "displayName", "contentMarkdown"],

  additionalProperties: false,
});


const CAPABILITY_PATCH_SCHEMA = wrapPatchLayerResult({
  type: "object",

  properties: {
    name: { type: "string" },
    displayName: { type: "string" },
    description: { type: "string" },
    requestTemplateJson: { type: "string" },
    contentMarkdown: { type: "string" },
  },

  required: ["name", "displayName", "description", "requestTemplateJson", "contentMarkdown"],

  additionalProperties: false,
});


export {
  MAINTENANCE_DECISION_SCHEMA,
  MODEL_PATCH_SCHEMA,
  API_PATCH_SCHEMA,
  TOOL_PATCH_SCHEMA,
  CAPABILITY_PATCH_SCHEMA,
};
