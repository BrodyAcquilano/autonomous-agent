import "dotenv/config";

import { MongoClient } from "mongodb";

let client = null;
let db = null;

async function connectDB() {
  if (
    db
  ) {
    return db;
  }


  const {
    MONGO_URI,
    DB_NAME,
  } =
    process.env;


  if (
    !MONGO_URI
  ) {
    throw new Error(
      "MONGO_URI is not defined.",
    );
  }


  if (
    !DB_NAME
  ) {
    throw new Error(
      "DB_NAME is not defined.",
    );
  }


  client =
    new MongoClient(
      MONGO_URI,
    );

  await client.connect();

  db =
    client.db(
      DB_NAME,
    );

  return db;
}



function getDB() {
  if (
    !db
  ) {
    throw new Error(
      "MongoDB is not connected. Call connectDB() first.",
    );
  }


  return db;
}

export {
  connectDB,
  getDB,
};
