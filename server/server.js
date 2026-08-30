import "dotenv/config";

import express from "express";

import openAIImagesRoutes from "./Routes/Azure/OpenAIImages.js";
import openAIResponsesRoutes from "./Routes/Azure/OpenAIResponses.js";

import apisRoutes from "./Routes/MongoDB/Apis.js";
import capabilitiesRoutes from "./Routes/MongoDB/Capabilities.js";
import modelsRoutes from "./Routes/MongoDB/Models.js";
import toolsRoutes from "./Routes/MongoDB/Tools.js";

import routerRoutes from "./Routes/Router/router.js";

import {
  connectAnalyticsDB,
  connectDB,
  connectMaintenanceDB,
} from "./Services/MongoDB/MongoDB.js";


const app =
  express();


const PORT =
  Number(
    process.env.PORT,
  ) ||
  3000;


app.use(
  express.json({
    limit:
      "10mb",
  }),
);


app.use(
  "/api/models",
  modelsRoutes,
);


app.use(
  "/api/apis",
  apisRoutes,
);


app.use(
  "/api/tools",
  toolsRoutes,
);


app.use(
  "/api/capabilities",
  capabilitiesRoutes,
);


app.use(
  "/api/router",
  routerRoutes,
);


app.use(
  "/api/azure/openai-responses",
  openAIResponsesRoutes,
);


app.use(
  "/api/azure/openai-images",
  openAIImagesRoutes,
);


async function start() {
  await connectDB();

  console.log(
    "Connected to MongoDB (autonomous).",
  );


  /*
   * Analytics/Maintenance are separate
   * databases the user provisions on their
   * own schedule — a missing env var here
   * should not take down the whole server,
   * since Models/Router already work fully
   * on the autonomous database alone.
   */
  try {
    await connectAnalyticsDB();

    console.log(
      "Connected to MongoDB (analytics).",
    );
  } catch (
    error
  ) {
    console.warn(
      `Analytics database not connected: ${error.message}`,
    );
  }


  try {
    await connectMaintenanceDB();

    console.log(
      "Connected to MongoDB (maintenance).",
    );
  } catch (
    error
  ) {
    console.warn(
      `Maintenance database not connected: ${error.message}`,
    );
  }


  app.listen(
    PORT,
    () => {
      console.log(
        `Server running on port ${PORT}`,
      );
    },
  );
}


start().catch(
  (error) => {
    console.error(
      "Failed to start server:",
      error,
    );

    process.exit(
      1,
    );
  },
);