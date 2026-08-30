import {
  createResponse,
} from "../Azure/OpenAIResponses.js";

import {
  getAnalystAgentProfile,
} from "../../Runtime/Agents.js";

import {
  getStageTextFormat,
} from "./RouterSchemas.js";

import {
  ANALYST_REVIEW_SCHEMA,
} from "./AnalystSchemas.js";


/*
 * Same fixed model as the Router's own
 * reasoning calls. This is a separate agent
 * instance/prompt, not a shared conversation —
 * every call is fully self-contained, same
 * convention as the Router stages.
 */
const ANALYST_MODEL =
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
 * Analyst agent only ever READS what the
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
  /*
   * Loaded once at server startup
   * (server/Runtime/Agents.js), not re-fetched
   * from MongoDB on every stage review.
   */
  const agent =
    getAnalystAgentProfile();


  if (
    !agent
  ) {
    return fallbackVerdict(
      "Analyst agent is not configured; skipping review.",
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
            ANALYST_MODEL,

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
              "analyst_stage_review",
              ANALYST_REVIEW_SCHEMA,
            ),
        },
      );
  } catch (
    error
  ) {
    return fallbackVerdict(
      `Analyst review call failed: ${error.message}`,
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
      `Analyst agent returned unparseable output: ${error.message}`,
    );
  }
}


export {
  reviewRouterStage,
};
