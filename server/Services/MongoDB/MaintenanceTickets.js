import { ObjectId } from "mongodb";

import { getMaintenanceDB } from "./MongoDB.js";


/*
 * Only the Maintenance agent ever files a
 * ticket now — every other agent (router,
 * analyst) only ever writes an unprocessed
 * incident LOG (see MaintenanceLogs.js), which
 * Maintenance itself reads back, investigates,
 * and decides whether to escalate. A ticket
 * therefore always carries two different
 * agent identities: `agentName` (always
 * "maintenance" — who is submitting it) and
 * `loggedBy` (whoever's incident log this
 * ticket was derived from — router, analyst,
 * or maintenance itself for something it found
 * on its own sweep). The frontend filters
 * tickets by `loggedBy`, since that is what a
 * human actually cares about ("what did the
 * router run into"), not who did the paperwork.
 *
 * Every ticket is still written TWICE, on
 * purpose, to the same maintenance database:
 *
 * 1. Into `maintenance.maintenance` — the
 *    Maintenance agent's own permanent log of
 *    every ticket it has ever filed. Never
 *    mutated after creation.
 * 2. Into the shared `maintenance.tickets`
 *    collection — the "active tickets" queue
 *    the Maintenance page lists from. This copy
 *    DOES change over time: its `status` moves
 *    from "new" to "reviewed" when a human
 *    acknowledges it without acting yet, and the
 *    document is deleted from this collection
 *    entirely (the permanent copy is untouched)
 *    once it is either dismissed ("ignored") or
 *    consumed by a restart.
 *
 * Both writes share the same _id so a ticket can
 * always be cross-referenced between its
 * permanent log entry and its active-queue entry.
 */
function getAgentCollection(
  agentName,
) {
  return getMaintenanceDB().collection(
    agentName,
  );
}


function getTicketsCollection() {
  return getMaintenanceDB().collection(
    "tickets",
  );
}


async function createMaintenanceTicket(
  agentName,
  ticket,
) {
  const ticketId =
    new ObjectId();

  const document = {
    _id:
      ticketId,

    ...ticket,

    status:
      "new",

    createdAt:
      new Date(),
  };


  await getAgentCollection(
    agentName,
  ).insertOne(
    document,
  );


  await getTicketsCollection().insertOne(
    {
      ...document,

      agentName,
    },
  );


  return document;
}


async function getActiveTicket(
  ticketId,
) {
  if (
    !ObjectId.isValid(
      ticketId,
    )
  ) {
    return null;
  }


  return getTicketsCollection().findOne(
    {
      _id:
        new ObjectId(
          ticketId,
        ),
    },
  );
}


/*
 * Every currently-active ticket, across every
 * agent, for the Maintenance page's tickets view.
 */
async function getAllActiveTickets() {
  return getTicketsCollection()
    .find({})
    .sort({
      createdAt:
        -1,
    })
    .toArray();
}


/*
 * "Reviewed, come back to it later" — the human
 * acknowledged the ticket but has not decided its
 * outcome yet, so it stays in the active queue.
 */
async function updateTicketStatus(
  ticketId,
  status,
) {
  if (
    !ObjectId.isValid(
      ticketId,
    )
  ) {
    return null;
  }


  await getTicketsCollection().updateOne(
    {
      _id:
        new ObjectId(
          ticketId,
        ),
    },
    {
      $set:
        {
          status,
        },
    },
  );


  return getTicketsCollection().findOne(
    {
      _id:
        new ObjectId(
          ticketId,
        ),
    },
  );
}


/*
 * Removes a ticket from the active queue only —
 * the permanent per-agent log entry is untouched.
 * Used for both "reviewed, ignored" (a human
 * decided no action is needed) and for a restart
 * (the request-service route consumes the ticket
 * when it resumes a run from it). Neither case is
 * a general-purpose "delete this ticket" affordance
 * — it is always the side effect of one of those
 * two specific actions.
 */
async function deleteTicket(
  ticketId,
) {
  if (
    !ObjectId.isValid(
      ticketId,
    )
  ) {
    return;
  }


  await getTicketsCollection().deleteOne(
    {
      _id:
        new ObjectId(
          ticketId,
        ),
    },
  );
}


/*
 * Unlike deleteTicket() above (which only ever
 * removes the active-queue copy, for "ignore"
 * and for a restart consuming it), this removes
 * a ticket completely — both its active-queue
 * copy and its permanent maintenance.maintenance
 * copy. Used only when the incident LOG that
 * produced this ticket is itself being deleted:
 * a log referencing a ticket that no longer has
 * any record of itself is a dangling reference,
 * so deleting the log takes the ticket with it.
 * The reverse is never true — deleting a ticket
 * (ignoring it, or a restart consuming it) never
 * touches the log that produced it.
 */
async function deleteTicketEverywhere(
  ticketId,
) {
  if (
    !ObjectId.isValid(
      ticketId,
    )
  ) {
    return;
  }


  const filter =
    {
      _id:
        new ObjectId(
          ticketId,
        ),
    };


  await Promise.all(
    [
      getTicketsCollection().deleteOne(
        filter,
      ),

      getAgentCollection(
        "maintenance",
      ).deleteOne(
        filter,
      ),
    ],
  );
}


/*
 * Every maintenance ticket/log carries the
 * analytics.router run's own _id as
 * `state.runId` — that is the whole point of
 * storing it, so a restart (or a human) can pull
 * up the full run trace. If that analytics run
 * is deleted, a maintenance record still pointing
 * at it is not "history" anymore, it is a dangling
 * reference to a run nobody can inspect and a
 * restart could never meaningfully continue — so
 * deleting an analytics log cascades here rather
 * than leaving orphaned tickets/logs behind.
 *
 * Searches every collection in the maintenance
 * database except the shared `tickets` queue
 * itself first (discovered dynamically, so this
 * does not need to know agent names in advance),
 * then the `tickets` queue, removing any document
 * whose `state.runId` matches. Returns the ids it
 * removed so the frontend can prune the same
 * entries from its own local ticket/log state.
 */
async function deleteMaintenanceRecordsForRun(
  runId,
) {
  const db =
    getMaintenanceDB();

  const filter =
    {
      "state.runId":
        runId,
    };


  const collections =
    await db
      .listCollections()
      .toArray();

  const logIds =
    [];

  for (
    const collectionInfo
    of collections
  ) {
    if (
      collectionInfo.name ===
      "tickets"
    ) {
      continue;
    }


    const matches =
      await db
        .collection(
          collectionInfo.name,
        )
        .find(
          filter,
        )
        .project(
          {
            _id:
              1,
          },
        )
        .toArray();


    if (
      matches.length
    ) {
      logIds.push(
        ...matches.map(
          (
            doc,
          ) =>
            doc._id.toString(),
        ),
      );


      await db
        .collection(
          collectionInfo.name,
        )
        .deleteMany(
          filter,
        );
    }
  }


  const matchingTickets =
    await getTicketsCollection()
      .find(
        filter,
      )
      .project(
        {
          _id:
            1,
        },
      )
      .toArray();

  const ticketIds =
    matchingTickets.map(
      (
        doc,
      ) =>
        doc._id.toString(),
    );


  if (
    ticketIds.length
  ) {
    await getTicketsCollection().deleteMany(
      filter,
    );
  }


  return {
    ticketIds,
    logIds,
  };
}


export {
  createMaintenanceTicket,
  getActiveTicket,
  getAllActiveTickets,
  updateTicketStatus,
  deleteTicket,
  deleteTicketEverywhere,
  deleteMaintenanceRecordsForRun,
};
