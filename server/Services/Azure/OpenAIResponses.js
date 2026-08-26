import "dotenv/config";

import OpenAI from "openai";


function getAzureConfig(
  model,
) {
  const {
    AZURE_OPENAI_BASE_URL,
    AZURE_OPENAI_API_KEY,

    AZURE_OPENAI_GPT_56_TERRA_DEPLOYMENT_NAME,
    AZURE_OPENAI_GPT_53_CODEX_DEPLOYMENT_NAME,
  } = process.env;


  if (
    !AZURE_OPENAI_BASE_URL
  ) {
    throw new Error(
      "AZURE_OPENAI_BASE_URL is not defined.",
    );
  }


  if (
    !AZURE_OPENAI_API_KEY
  ) {
    throw new Error(
      "AZURE_OPENAI_API_KEY is not defined.",
    );
  }


  let deploymentName;


  switch (
    model
  ) {
    case "gpt-5.6-terra":
      deploymentName =
        AZURE_OPENAI_GPT_56_TERRA_DEPLOYMENT_NAME;

      break;


    case "gpt-5.3-codex":
      deploymentName =
        AZURE_OPENAI_GPT_53_CODEX_DEPLOYMENT_NAME;

      break;


    default:
      throw new Error(
        `Unsupported Azure OpenAI Responses model: ${model}`,
      );
  }


  if (
    !deploymentName
  ) {
    throw new Error(
      `Deployment environment variable is not defined for model: ${model}`,
    );
  }


  return {
    baseURL:
      `${AZURE_OPENAI_BASE_URL.replace(
        /\/+$/,
        "",
      )}/`,

    apiKey:
      AZURE_OPENAI_API_KEY,

    deploymentName,
  };
}


function createAzureClient(
  model,
) {
  const {
    baseURL,
    apiKey,
  } =
    getAzureConfig(
      model,
    );


  return new OpenAI({
    apiKey,
    baseURL,
  });
}


function addOptionalField(
  request,
  key,
  value,
) {
  if (
    value !==
      undefined &&
    value !==
      null
  ) {
    request[
      key
    ] =
      value;
  }
}


async function createResponse({
  model,
  input,

  instructions,
  reasoning,

  max_output_tokens,

  tools,
  tool_choice,
  parallel_tool_calls,
  max_tool_calls,

  text,

  previous_response_id,

  store,
  stream,
  background,

  metadata,
  include,
}) {
  const {
    deploymentName,
  } =
    getAzureConfig(
      model,
    );


  const client =
    createAzureClient(
      model,
    );


  const request = {
    model:
      deploymentName,

    input,
  };


  addOptionalField(
    request,
    "instructions",
    instructions,
  );


  addOptionalField(
    request,
    "reasoning",
    reasoning,
  );


  addOptionalField(
    request,
    "max_output_tokens",
    max_output_tokens,
  );


  addOptionalField(
    request,
    "tools",
    tools,
  );


  addOptionalField(
    request,
    "tool_choice",
    tool_choice,
  );


  addOptionalField(
    request,
    "parallel_tool_calls",
    parallel_tool_calls,
  );


  addOptionalField(
    request,
    "max_tool_calls",
    max_tool_calls,
  );


  addOptionalField(
    request,
    "text",
    text,
  );


  addOptionalField(
    request,
    "previous_response_id",
    previous_response_id,
  );


  addOptionalField(
    request,
    "store",
    store,
  );


  addOptionalField(
    request,
    "stream",
    stream,
  );


  addOptionalField(
    request,
    "background",
    background,
  );


  addOptionalField(
    request,
    "metadata",
    metadata,
  );


  addOptionalField(
    request,
    "include",
    include,
  );


  return client.responses.create(
    request,
  );
}


export {
  createAzureClient,
  createResponse,
  getAzureConfig,
};