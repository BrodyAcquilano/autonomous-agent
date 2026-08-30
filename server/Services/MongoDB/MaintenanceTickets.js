import { getMaintenanceDB } from "./MongoDB.js";


/*
 * The maintenance database holds one
 * collection PER AGENT, named after whichever
 * agent's own judgment produced the ticket —
 * e.g. maintenance.router, maintenance.analytics
 * — rather than one shared `tickets` collection.
 * This is keyed by WHOSE DECISION it was, not by
 * which code physically performs the write: the
 * Analytics agent has no database access of its
 * own, so the Router calls this on its behalf
 * whenever Analytics flags something, but that
 * ticket still lands in maintenance.analytics.
 * A future Maintenance or Worker agent filing
 * its own tickets would get its own collection
 * the same way.
 */
function getCollection(
  agentName,
) {
  return getMaintenanceDB().collection(
    agentName,
  );
}


async function createMaintenanceTicket(
  agentName,
  ticket,
) {
  const document = {
    ...ticket,

    status:
      "open",

    createdAt:
      new Date(),
  };


  const result =
    await getCollection(
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


export {
  createMaintenanceTicket,
};
