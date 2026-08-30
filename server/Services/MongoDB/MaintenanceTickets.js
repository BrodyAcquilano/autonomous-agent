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
 *    This copy is never mutated after creation —
 *    it is the permanent historical record.
 * 2. Into one shared maintenance.tickets
 *    collection — the "active tickets" queue the
 *    Maintenance page lists from. This copy DOES
 *    change over time: its `status` moves from
 *    "new" to "reviewed" when a human acknowledges
 *    it without acting yet, and the document is
 *    deleted from this collection entirely (the
 *    per-agent copy is untouched) once it is
 *    either dismissed ("ignored") or consumed by
 *    a restart — at that point it is no longer
 *    "active."
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


export {
  createMaintenanceTicket,
  getActiveTicket,
  getAllActiveTickets,
  updateTicketStatus,
  deleteTicket,
};
