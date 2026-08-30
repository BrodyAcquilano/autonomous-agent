import { ObjectId } from "mongodb";

import { getMaintenanceDB } from "./MongoDB.js";


/*
 * One collection per agent, named after the
 * agent (e.g. maintenance.router,
 * maintenance.analyst — matching the same
 * `name` used in the agents collection, the
 * directory's `agentId`, and analytics'
 * per-agent collections, so a single agent name
 * string always resolves to the right
 * collection everywhere in the system). This is
 * a generic reader/deleter that works for any
 * agent name without needing a matching case
 * added per agent — a collection that has never
 * been written to (e.g. maintenance.worker,
 * since the Worker never files its own tickets)
 * simply returns an empty list rather than
 * erroring.
 */
function getAgentCollection(
  agentName,
) {
  return getMaintenanceDB().collection(
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


/*
 * Unlike tickets, a log entry can be deleted
 * outright at any time — it is a permanent
 * record only in the sense that nothing in the
 * system re-derives it from anywhere else, not
 * in the sense that it must be kept forever.
 */
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
