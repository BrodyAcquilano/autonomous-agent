/*
 * Structured-output JSON schema BUILDERS for
 * every Router stage.
 *
 * Every stage shares one shape:
 *
 *   { result: <stage decision> | <maintenance ticket> }
 *
 * Id-referencing fields (modelId, apiId,
 * toolIds items, capabilityId) are built with
 * a real `enum` of the actual candidate ids
 * for that specific call, not a bare string
 * type — this makes "never invent a model or
 * tool that doesn't exist" a hard schema
 * constraint the API itself enforces, not just
 * a prompt instruction the model could ignore.
 *
 * Decision schemas keep every field required
 * (Azure/OpenAI strict structured outputs do
 * not support optional properties) and use
 * empty-string sentinels for fields that do
 * not apply to a given branch, discriminated
 * by an explicit enum field rather than nested
 * unions, to keep schema validation reliable.
 */

const MAINTENANCE_TICKET_SCHEMA = {
  type: "object",

  properties: {
    type: {
      type: "string",
      const: "maintenance_ticket",
    },

    ticketType: {
      type: "string",
      enum: [
        "error",
        "request",
      ],
    },

    message: {
      type: "string",
    },

    details: {
      type: "string",
    },
  },

  required: [
    "type",
    "ticketType",
    "message",
    "details",
  ],

  additionalProperties: false,
};


function wrapResult(
  decisionSchema,
) {
  return {
    type: "object",

    properties: {
      result: {
        anyOf: [
          decisionSchema,
          MAINTENANCE_TICKET_SCHEMA,
        ],
      },
    },

    required: [
      "result",
    ],

    additionalProperties: false,
  };
}


/* --------------------------------
   STAGE 1: MODEL SELECTION
-------------------------------- */

function buildStage1Schema(
  validModelIds,
) {
  return wrapResult({
    type: "object",

    properties: {
      type: {
        type: "string",
        const: "model_decision",
      },

      modelId: {
        type: "string",
        enum: validModelIds,
      },

      reasoning: {
        type: "string",
      },
    },

    required: [
      "type",
      "modelId",
      "reasoning",
    ],

    additionalProperties: false,
  });
}


/* --------------------------------
   STAGE 2: API SELECTION
-------------------------------- */

function buildStage2Schema(
  validApiIds,
) {
  return wrapResult({
    type: "object",

    properties: {
      type: {
        type: "string",
        const: "api_decision",
      },

      apiId: {
        type: "string",
        enum: validApiIds,
      },

      reasoning: {
        type: "string",
      },
    },

    required: [
      "type",
      "apiId",
      "reasoning",
    ],

    additionalProperties: false,
  });
}


/* --------------------------------
   STAGE 3: TOOL SELECTION
-------------------------------- */

function buildStage3Schema(
  validToolIds,
) {
  return wrapResult({
    type: "object",

    properties: {
      type: {
        type: "string",
        const: "tool_decision",
      },

      toolIds: {
        type: "array",

        items: {
          type: "string",
          enum: validToolIds,
        },
      },

      reasoning: {
        type: "string",
      },
    },

    required: [
      "type",
      "toolIds",
      "reasoning",
    ],

    additionalProperties: false,
  });
}


/* --------------------------------
   STAGE 4: CAPABILITY CONFIGURATION
-------------------------------- */

/*
 * decisionType discriminates the branch
 * instead of a nested union so every array
 * item keeps one flat, uniform shape.
 *
 * "existing_capability" only uses capabilityId
 * (constrained to the union of every valid
 * capability id across every selected tool —
 * RouterAgent.js separately checks server-side
 * that the chosen capabilityId actually
 * belongs to the claimed toolId, since cross-
 * field validation isn't expressible here).
 *
 * "new_capability" only uses the name/
 * displayName/description/requestTemplateJson/
 * contentMarkdown fields; capabilityId is "".
 */
function buildStage4Schema(
  validToolIds,
  validCapabilityIds,
) {
  const capabilityIdEnum =
    [
      "",
      ...validCapabilityIds,
    ];


  const itemSchema = {
    type: "object",

    properties: {
      toolId: {
        type: "string",
        enum: validToolIds,
      },

      decisionType: {
        type: "string",
        enum: [
          "existing_capability",
          "new_capability",
        ],
      },

      capabilityId: {
        type: "string",
        enum: capabilityIdEnum,
      },

      name: {
        type: "string",
      },

      displayName: {
        type: "string",
      },

      description: {
        type: "string",
      },

      requestTemplateJson: {
        type: "string",
      },

      contentMarkdown: {
        type: "string",
      },

      reasoning: {
        type: "string",
      },
    },

    required: [
      "toolId",
      "decisionType",
      "capabilityId",
      "name",
      "displayName",
      "description",
      "requestTemplateJson",
      "contentMarkdown",
      "reasoning",
    ],

    additionalProperties: false,
  };


  return wrapResult({
    type: "object",

    properties: {
      type: {
        type: "string",
        const: "tool_configurations",
      },

      configurations: {
        type: "array",

        items:
          itemSchema,
      },
    },

    required: [
      "type",
      "configurations",
    ],

    additionalProperties: false,
  });
}


/* --------------------------------
   STAGE 5: FINAL REQUEST ASSEMBLY
-------------------------------- */

function buildStage5Schema() {
  return wrapResult({
    type: "object",

    properties: {
      type: {
        type: "string",
        const: "final_request",
      },

      requestJson: {
        type: "string",
      },

      reasoning: {
        type: "string",
      },
    },

    required: [
      "type",
      "requestJson",
      "reasoning",
    ],

    additionalProperties: false,
  });
}


/* --------------------------------
   TEXT FORMAT HELPER
-------------------------------- */

function getStageTextFormat(
  stageName,
  schema,
) {
  return {
    format: {
      type:
        "json_schema",

      name:
        stageName,

      schema,

      strict:
        true,
    },
  };
}


export {
  buildStage1Schema,
  buildStage2Schema,
  buildStage3Schema,
  buildStage4Schema,
  buildStage5Schema,
  getStageTextFormat,
};
