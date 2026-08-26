import "dotenv/config";

import express from "express";

import openAIImagesRoutes from "./Routes/Azure/OpenAIImages.js";
import openAIResponsesRoutes from "./Routes/Azure/OpenAIResponses.js";

import apisRoutes from "./Routes/Apis/apis.js";
import modelsRoutes from "./Routes/Models/models.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use("/api/models", modelsRoutes);

app.use("/api/apis", apisRoutes);

app.use("/api/azure/openai-responses", openAIResponsesRoutes);

app.use("/api/azure/openai-images", openAIImagesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
