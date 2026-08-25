import "dotenv/config";

import OpenAI from "openai";


function getAzureConfig() {
  const {
    AZURE_OPENAI_BASE_URL,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT_NAME,
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


  if (
    !AZURE_OPENAI_DEPLOYMENT_NAME
  ) {
    throw new Error(
      "AZURE_OPENAI_DEPLOYMENT_NAME is not defined.",
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

    deploymentName:
      AZURE_OPENAI_DEPLOYMENT_NAME,
  };
}


function createAzureClient() {
  const {
    baseURL,
    apiKey,
  } = getAzureConfig();


  return new OpenAI({
    apiKey,
    baseURL,
  });
}


async function createResponse({
  input,
  instructions,
  maxOutputTokens,
}) {
  const {
    deploymentName,
  } = getAzureConfig();


  const client =
    createAzureClient();


  const request = {
    model:
      deploymentName,

    input,
  };


  if (
    instructions
  ) {
    request.instructions =
      instructions;
  }


  if (
    maxOutputTokens
  ) {
    request.max_output_tokens =
      maxOutputTokens;
  }


  return client.responses.create(
    request,
  );
}


export {
  createAzureClient,
  createResponse,
  getAzureConfig,
};