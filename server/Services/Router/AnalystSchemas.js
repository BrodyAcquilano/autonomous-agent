/*
 * Structured-output schema for the Analyst
 * agent's per-stage review. Always one flat
 * shape (no maintenance_ticket alternative
 * needed) — filing a ticket is an independent
 * boolean, since the agent can flag a concern
 * without necessarily stopping the run, or
 * stop the run without necessarily needing a
 * ticket on file.
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

        fileTicket: {
          type: "boolean",
        },

        ticketType: {
          type: "string",
          enum: [
            "error",
            "request",
            "",
          ],
        },

        ticketMessage: {
          type: "string",
        },

        ticketDetails: {
          type: "string",
        },

        reasoning: {
          type: "string",
        },
      },

      required: [
        "action",
        "fileTicket",
        "ticketType",
        "ticketMessage",
        "ticketDetails",
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
