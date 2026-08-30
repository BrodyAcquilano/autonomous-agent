import "dotenv/config";

import { MongoClient } from "mongodb";

let client = null;

/*
 * One shared MongoClient (one connection pool),
 * multiple logical databases on the same
 * cluster — autonomous, analytics, maintenance.
 * MONGO_URI already carries full cluster access;
 * client.db(name) just selects which database a
 * given call reads/writes.
 */
const databases = {};


async function connectClient() {
  if (
    client
  ) {
    return client;
  }


  const {
    MONGO_URI,
  } =
    process.env;


  if (
    !MONGO_URI
  ) {
    throw new Error(
      "MONGO_URI is not defined.",
    );
  }


  client =
    new MongoClient(
      MONGO_URI,
    );

  await client.connect();


  return client;
}


async function connectDB() {
  if (
    databases.autonomous
  ) {
    return databases.autonomous;
  }


  const {
    DB_NAME,
  } =
    process.env;


  if (
    !DB_NAME
  ) {
    throw new Error(
      "DB_NAME is not defined.",
    );
  }


  await connectClient();


  databases.autonomous =
    client.db(
      DB_NAME,
    );


  return databases.autonomous;
}


function getDB() {
  if (
    !databases.autonomous
  ) {
    throw new Error(
      "MongoDB is not connected. Call connectDB() first.",
    );
  }


  return databases.autonomous;
}


/*
 * Analytics and Maintenance are separate
 * databases on purpose — the Analytics agent
 * and a future Maintenance agent should never
 * be able to interfere with each other or with
 * the autonomous execution-brain data, and each
 * can eventually get its own scoped credentials.
 *
 * Connecting is non-fatal if the env var isn't
 * set yet: the autonomous database (Models/
 * Router) stays fully usable even before
 * ANALYTICS_DB_NAME / MAINTENANCE_DB_NAME exist.
 */
async function connectAnalyticsDB() {
  if (
    databases.analytics
  ) {
    return databases.analytics;
  }


  const {
    ANALYTICS_DB_NAME,
  } =
    process.env;


  if (
    !ANALYTICS_DB_NAME
  ) {
    throw new Error(
      "ANALYTICS_DB_NAME is not defined.",
    );
  }


  await connectClient();


  databases.analytics =
    client.db(
      ANALYTICS_DB_NAME,
    );


  return databases.analytics;
}


function getAnalyticsDB() {
  if (
    !databases.analytics
  ) {
    throw new Error(
      "Analytics MongoDB is not connected. Call connectAnalyticsDB() first.",
    );
  }


  return databases.analytics;
}


async function connectMaintenanceDB() {
  if (
    databases.maintenance
  ) {
    return databases.maintenance;
  }


  const {
    MAINTENANCE_DB_NAME,
  } =
    process.env;


  if (
    !MAINTENANCE_DB_NAME
  ) {
    throw new Error(
      "MAINTENANCE_DB_NAME is not defined.",
    );
  }


  await connectClient();


  databases.maintenance =
    client.db(
      MAINTENANCE_DB_NAME,
    );


  return databases.maintenance;
}


function getMaintenanceDB() {
  if (
    !databases.maintenance
  ) {
    throw new Error(
      "Maintenance MongoDB is not connected. Call connectMaintenanceDB() first.",
    );
  }


  return databases.maintenance;
}


export {
  connectDB,
  getDB,
  connectAnalyticsDB,
  getAnalyticsDB,
  connectMaintenanceDB,
  getMaintenanceDB,
};
