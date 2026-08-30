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


export { MAINTENANCE_DECISION_SCHEMA };
