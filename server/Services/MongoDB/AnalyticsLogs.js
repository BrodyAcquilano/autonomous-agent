import { ObjectId } from "mongodb";

import { getAnalyticsDB } from "./MongoDB.js";


/*
 * One collection per agent, named after the
 * agent (analytics.router, analytics.worker —
 * same convention as maintenance logs). Unlike
 * maintenance.router/maintenance.analyst, which
 * share an identical ticket shape,
 * analytics.router (a full per-stage run trace)
 * and analytics.worker (one execution record)
 * are genuinely different documents — this
 * reader stays deliberately generic (whatever
 * fields exist, exist) rather than assuming a
 * shared schema, since a future agent's own
 * analytics collection will have its own shape
 * too. An agent whose collection has never been
 * written to (e.g. analytics.analyst, since the
 * Analyst never writes to analytics itself)
 * simply comes back empty rather than erroring.
 */
function getAgentCollection(
  agentName,
) {
  return getAnalyticsDB().collection(
    agentName,
  );
}


async function getLogsForAgent(
  agentName,
) {
  const documents =
    await getAgentCollection(
      agentName,
    )
      .find({})
      .sort({
        createdAt:
          -1,
      })
      .toArray();


  return documents.map(
    (
      document,
    ) => ({
      ...document,

      agentName,
    }),
  );
}


async function deleteLogEntry(
  agentName,
  logId,
) {
  if (
    !ObjectId.isValid(
      logId,
    )
  ) {
    return;
  }


  await getAgentCollection(
    agentName,
  ).deleteOne(
    {
      _id:
        new ObjectId(
          logId,
        ),
    },
  );
}


export {
  getLogsForAgent,
  deleteLogEntry,
};
