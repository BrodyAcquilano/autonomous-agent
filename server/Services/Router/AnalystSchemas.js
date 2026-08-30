/*
 * Structured-output schema for the Analyst
 * agent's per-stage review. Always one flat
 * shape (no maintenance_ticket alternative
 * needed) — logging an issue is an independent
 * boolean, since the agent can flag a concern
 * without necessarily stopping the run, or
 * stop the run without necessarily needing to
 * log anything. The Analyst never files a
 * ticket itself (only the Maintenance agent
 * does, after reading this log back later) —
 * it only ever logs an incident for Maintenance
 * to triage.
 */
const ANALYST_REVIEW_SCHEMA = {
  type: "object",

  properties: {
    result: {
      type: "object",

      properties: {
        action: {
          type: "string",
          enum: [
            "continue",
            "stop",
          ],
        },

        logIssue: {
          type: "boolean",
        },

        logType: {
          type: "string",
          enum: [
            "error",
            "request",
            "",
          ],
        },

        logMessage: {
          type: "string",
        },

        logDetails: {
          type: "string",
        },

        reasoning: {
          type: "string",
        },
      },

      required: [
        "action",
        "logIssue",
        "logType",
        "logMessage",
        "logDetails",
        "reasoning",
      ],

      additionalProperties: false,
    },
  },

  required: [
    "result",
  ],

  additionalProperties: false,
};


export {
  ANALYST_REVIEW_SCHEMA,
};
