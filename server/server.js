import "dotenv/config";

import express from "express";

import openAIResponsesRoutes from "./Routes/Azure/OpenAIResponses.js";


const app =
  express();

const PORT =
  Number(
    process.env.PORT,
  ) ||
  3000;


app.use(
  express.json({
    limit: "10mb",
  }),
);


app.use(
  "/api/azure/openai-responses",
  openAIResponsesRoutes,
);


app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`,
    );
  },
);