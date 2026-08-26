import "dotenv/config";

import OpenAI from "openai";


function getAzureConfig(
  model,
) {
  const {
    AZURE_OPENAI_BASE_URL,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_GPT_IMAGE_2_DEPLOYMENT_NAME,
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
    case "gpt-image-2":
      deploymentName =
        AZURE_OPENAI_GPT_IMAGE_2_DEPLOYMENT_NAME;

      break;


    default:
      throw new Error(
        `Unsupported Azure OpenAI Images model: ${model}`,
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
  } = getAzureConfig(
    model,
  );


  return new OpenAI({
    apiKey,
    baseURL,

    defaultQuery: {
      "api-version":
        "preview",
    },
  });
}


async function createImage({
  model,
  prompt,
  size = "1024x1024",
  quality = "high",
  outputFormat = "png",
  background,
  outputCompression,
  numberOfImages = 1,
}) {
  const {
    deploymentName,
  } = getAzureConfig(
    model,
  );


  const client =
    createAzureClient(
      model,
    );


  const request = {
    model:
      deploymentName,

    prompt,

    size,

    quality,

    n:
      numberOfImages,

    output_format:
      outputFormat,
  };


  if (
    background
  ) {
    request.background =
      background;
  }


  if (
    outputCompression !==
      undefined
  ) {
    request.output_compression =
      outputCompression;
  }


  return client.images.generate(
    request,
  );
}


export {
  createAzureClient,
  createImage,
  getAzureConfig,
};