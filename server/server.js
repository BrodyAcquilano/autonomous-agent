import "dotenv/config";

import express from "express";

import openAIImagesRoutes from "./Routes/Azure/OpenAIImages.js";
import openAIResponsesRoutes from "./Routes/Azure/OpenAIResponses.js";

import agentsRoutes from "./Routes/MongoDB/Agents.js";
import apisRoutes from "./Routes/MongoDB/Apis.js";
import capabilitiesRoutes from "./Routes/MongoDB/Capabilities.js";
import directoryRoutes from "./Routes/MongoDB/Directory.js";
import modelsRoutes from "./Routes/MongoDB/Models.js";
import toolsRoutes from "./Routes/MongoDB/Tools.js";

/*
 * Routes/InternalOperations, unlike
 * Routes/Azure and Routes/MongoDB, is not
 * scoped to one external integration — it's
 * the entry point for requesting a service
 * from the company (Router -> Temp Worker),
 * which internally decides which Azure API to
 * call per task rather than being tied to one.
 * Named RequestService rather than "router"
 * since the company structure behind it may be
 * reconfigured later.
 */
import requestServiceRoutes from "./Routes/InternalOperations/RequestService.js";

import {
  connectAnalyticsDB,
  connectDB,
  connectMaintenanceDB,
} from "./Services/MongoDB/MongoDB.js";

import {
  initAgents,
} from "./Runtime/Agents.js";


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
  "/api/agents",
  agentsRoutes,
);


app.use(
  "/api/directory",
  directoryRoutes,
);


app.use(
  "/api/request-service",
  requestServiceRoutes,
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
   * Load the Router/Analyst/Worker agent
   * profiles into memory once, here, rather
   * than having each of them fetch its own
   * profile from MongoDB on every single API
   * call. They stay live in server/Runtime/
   * Agents.js for the life of the process.
   */
  await initAgents();

  console.log(
    "Agent runtime initialized (router, analyst, worker).",
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