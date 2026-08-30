import { ObjectId } from "mongodb";

import { getMaintenanceDB } from "./MongoDB.js";

import { deleteTicketEverywhere } from "./MaintenanceTickets.js";


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
 * Written by an originating agent (router,
 * analyst — any agent with no database access
 * of its own is written on its behalf, same
 * convention as tickets used to be) whenever
 * that agent's own judgment flags something,
 * WITHOUT deciding what should happen about it.
 * This is the input side of the new pipeline:
 * an agent only ever logs an incident here; the
 * Maintenance agent is the only one who reads
 * these back and decides whether they are worth
 * escalating into an actual ticket. A log entry
 * starts "unprocessed" and is never written
 * twice anywhere else the way a ticket is.
 */
async function createMaintenanceLog(
  agentName,
  logEntry,
) {
  const document = {
    ...logEntry,

    status:
      "unprocessed",

    ticketId:
      null,

    createdAt:
      new Date(),
  };


  const result =
    await getAgentCollection(
      agentName,
    ).insertOne(
      document,
    );


  return {
    ...document,

    _id:
      result.insertedId,
  };
}


/*
 * Every collection in the maintenance database
 * except the two that are never a per-agent
 * incident log ("tickets", the shared active
 * queue, and "maintenance", the Maintenance
 * agent's own permanent record of tickets it
 * has filed) is scanned dynamically, so this
 * needs no per-agent-name case as new agents
 * start logging incidents.
 */
async function getAllUnprocessedLogs() {
  const db =
    getMaintenanceDB();

  const collections =
    await db
      .listCollections()
      .toArray();

  const results =
    [];

  for (
    const collectionInfo
    of collections
  ) {
    if (
      collectionInfo.name ===
        "tickets" ||
      collectionInfo.name ===
        "maintenance"
    ) {
      continue;
    }


    const documents =
      await db
        .collection(
          collectionInfo.name,
        )
        .find({
          status:
            "unprocessed",
        })
        .sort({
          createdAt:
            1,
        })
        .toArray();


    documents.forEach(
      (
        document,
      ) => {
        results.push(
          {
            ...document,

            agentName:
              collectionInfo.name,
          },
        );
      },
    );
  }


  return results;
}


/*
 * Marks an incident as escalated (a ticket was
 * filed from it) or dismissed (the Maintenance
 * agent decided it needed no ticket) — either
 * way it is done being triaged and future
 * sweeps should skip it.
 */
async function markLogProcessed(
  agentName,
  logId,
  ticketId =
    null,
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
  ).updateOne(
    {
      _id:
        new ObjectId(
          logId,
        ),
    },
    {
      $set:
        {
          status:
            "processed",

          ticketId:
            ticketId
              ? new ObjectId(
                  ticketId,
                )
              : null,
        },
    },
  );
}


/*
 * A log entry can be deleted outright at any
 * time — it is a permanent record only in the
 * sense that nothing in the system re-derives it
 * from anywhere else, not in the sense that it
 * must be kept forever. A ticket, though,
 * references the log that produced it, so
 * deleting the log takes its ticket with it
 * (both the active-queue copy and the permanent
 * maintenance.maintenance copy) — the reverse is
 * never true; deleting a ticket never touches the
 * log. For a router/analyst incident log, the
 * ticket to remove (if any) is whatever its own
 * `ticketId` field points to. For a "maintenance"
 * log, there is no separate `ticketId` field —
 * the document IS the ticket's own permanent
 * copy, sharing its `_id` with the active-queue
 * copy, so that same id is what gets removed.
 * Returns the removed ticket's id, if any, so the
 * frontend can prune it from local ticket state.
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
    return {
      ticketId:
        null,
    };
  }


  const objectId =
    new ObjectId(
      logId,
    );

  const collection =
    getAgentCollection(
      agentName,
    );

  const logDocument =
    agentName ===
    "maintenance"
      ? null
      : await collection.findOne(
          {
            _id:
              objectId,
          },
        );


  await collection.deleteOne(
    {
      _id:
        objectId,
    },
  );


  const ticketId =
    agentName ===
    "maintenance"
      ? logId
      : logDocument
          ?.ticketId
          ?.toString() ||
        null;


  if (
    ticketId
  ) {
    await deleteTicketEverywhere(
      ticketId,
    );
  }


  return {
    ticketId,
  };
}


export {
  getLogsForAgent,
  deleteLogEntry,
  createMaintenanceLog,
  getAllUnprocessedLogs,
  markLogProcessed,
};
