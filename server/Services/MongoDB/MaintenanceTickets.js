import { ObjectId } from "mongodb";

import { getMaintenanceDB } from "./MongoDB.js";


/*
 * Every ticket is written TWICE, on purpose,
 * to the same maintenance database:
 *
 * 1. Into a collection PER AGENT, named after
 *    whichever agent's own judgment produced
 *    the ticket — e.g. maintenance.router,
 *    maintenance.analyst — this is that agent's
 *    own permanent log. Keyed by WHOSE DECISION
 *    it was, not by which code physically
 *    performs the write: the Analyst agent has
 *    no database access of its own, so the
 *    Router calls this on its behalf whenever
 *    the Analyst flags something, but that
 *    ticket still lands in maintenance.analyst.
 * 2. Into one shared maintenance.tickets
 *    collection — the "active tickets" queue a
 *    Maintenance panel can list across every
 *    agent in one place, and the lookup surface
 *    a restart request reads from by ticket id
 *    alone, without needing to know in advance
 *    which per-agent collection produced it.
 *
 * Both writes share the same _id so a ticket can
 * always be cross-referenced between its
 * per-agent log entry and its active-queue entry.
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
      "open",

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


async function resolveActiveTicket(
  ticketId,
) {
  if (
    !ObjectId.isValid(
      ticketId,
    )
  ) {
    return;
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
          status:
            "resolved",

          resolvedAt:
            new Date(),
        },
    },
  );
}


export {
  createMaintenanceTicket,
  getActiveTicket,
  resolveActiveTicket,
};
