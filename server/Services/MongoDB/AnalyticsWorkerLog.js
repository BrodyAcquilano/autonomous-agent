import { getAnalyticsDB } from "./MongoDB.js";


/*
 * Lives in the analytics database's `worker`
 * collection — separate from `router` so
 * routing-stage token usage and actual
 * task-execution token usage can be compared
 * independently. One document per Worker
 * execution, referencing the Router run that
 * produced the route it executed.
 */
function getCollection() {
  return getAnalyticsDB().collection("worker");
}


async function logWorkerExecution(
  entry,
) {
  const document = {
    ...entry,

    createdAt:
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


export {
  logWorkerExecution,
};
