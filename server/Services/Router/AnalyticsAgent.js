import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getAgentByName,
} from "../MongoDB/Agents.js";

import {
  getStageTextFormat,
} from "./RouterSchemas.js";

import {
  ANALYTICS_REVIEW_SCHEMA,
} from "./AnalyticsSchemas.js";


const ANALYTICS_AGENT_NAME =
  "analytics";


/*
 * Same fixed model as the Router's own
 * reasoning calls. This is a separate agent
 * instance/prompt, not a shared conversation —
 * every call is fully self-contained, same
 * convention as the Router stages.
 */
const ANALYTICS_MODEL =
  "gpt-5.6-terra";


function fallbackVerdict(
  reasoning,
) {
  return {
    action:
      "continue",

    fileTicket:
      false,

    ticketType:
      "",

    ticketMessage:
      "",

    ticketDetails:
      "",

    reasoning,
  };
}


/*
 * Reviews one just-logged Router stage. The
 * Analytics agent only ever READS what the
 * server already wrote to the analytics
 * database — it never writes there itself.
 * Its only possible side effect is asking the
 * server (via its returned verdict) to file a
 * maintenance ticket and/or stop the run.
 *
 * Fails open: if the agent profile is missing
 * or its output can't be parsed, the Router
 * keeps running rather than being blocked by
 * an analytics-layer problem.
 */
async function reviewRouterStage({
  runId,
  task,
  stage,
  decision,
  tokenUsage,
  stagesCompleted,
}) {
  const agent =
    await getAgentByName(
      ANALYTICS_AGENT_NAME,
    );


  if (
    !agent
  ) {
    return fallbackVerdict(
      "Analytics agent is not configured; skipping review.",
    );
  }


  const input =
    [
      {
        role:
          "user",

        content: [
          {
            type:
              "input_text",

            text:
              `=== ROUTER RUN ===\nrunId: ${runId}\ntask: ${task}\nstagesCompletedSoFar: ${stagesCompleted}\n\n=== STAGE JUST LOGGED ===\nstage: ${stage}\ndecision: ${JSON.stringify(
                decision,
              )}\ntokenUsage: ${JSON.stringify(
                tokenUsage ||
                  {},
              )}`,
          },
        ],
      },
    ];


  let response;

  try {
    response =
      await createResponse(
        {
          model:
            ANALYTICS_MODEL,

          input,

          instructions:
            agent.contentMarkdown,

          reasoning: {
            effort:
              "low",

            mode:
              "standard",
          },

          max_output_tokens:
            4000,

          text:
            getStageTextFormat(
              "analytics_stage_review",
              ANALYTICS_REVIEW_SCHEMA,
            ),
        },
      );
  } catch (
    error
  ) {
    return fallbackVerdict(
      `Analytics review call failed: ${error.message}`,
    );
  }


  const outputText =
    typeof response.output_text ===
      "string"
      ? response.output_text
      : "";


  try {
    return JSON.parse(
      outputText,
    ).result;
  } catch (
    error
  ) {
    return fallbackVerdict(
      `Analytics agent returned unparseable output: ${error.message}`,
    );
  }
}


export {
  reviewRouterStage,
};
