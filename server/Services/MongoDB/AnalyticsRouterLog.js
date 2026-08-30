import { ObjectId } from "mongodb";

import { getAnalyticsDB } from "./MongoDB.js";


/*
 * Lives in the analytics database's `router`
 * collection — the Router's own append-only
 * process log, kept separate from the
 * autonomous capabilities-brain data so an
 * Analyst agent (or a future Maintenance
 * agent) can read/reason about it without any
 * access to (or risk of interfering with)
 * autonomous itself.
 */
function getCollection() {
  return getAnalyticsDB().collection("router");
}


async function createRouterRun(
  run,
) {
  const document = {
    ...run,

    stage:
      1,

    status:
      "in_progress",

    trace:
      [],

    createdAt:
      new Date(),

    updatedAt:
      new Date(),
  };


  const result =
    await getCollection().insertOne(
      document,
    );


  return {
    ...document,

    _id:
      result.insertedId,
  };
}


async function updateRouterRun(
  id,
  patch,
) {
  if (
    !ObjectId.isValid(
      id,
    )
  ) {
    return null;
  }


  await getCollection().updateOne(
    {
      _id:
        new ObjectId(
          id,
        ),
    },

    {
      $set: {
        ...patch,

        updatedAt:
          new Date(),
      },
    },
  );


  return getCollection().findOne({
    _id:
      new ObjectId(
        id,
      ),
  });
}


async function appendRouterRunTrace(
  id,
  traceEntry,
) {
  if (
    !ObjectId.isValid(
      id,
    )
  ) {
    return;
  }


  await getCollection().updateOne(
    {
      _id:
        new ObjectId(
          id,
        ),
    },

    {
      $push: {
        trace: {
          ...traceEntry,

          createdAt:
            new Date(),
        },
      },

      $set: {
        updatedAt:
          new Date(),
      },
    },
  );
}


async function getRouterRun(
  id,
) {
  if (
    !ObjectId.isValid(
      id,
    )
  ) {
    return null;
  }


  return getCollection().findOne({
    _id:
      new ObjectId(
        id,
      ),
  });
}


export {
  createRouterRun,
  updateRouterRun,
  appendRouterRunTrace,
  getRouterRun,
};
