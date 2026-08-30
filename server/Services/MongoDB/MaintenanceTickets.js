import { getMaintenanceDB } from "./MongoDB.js";


/*
 * Lives in the maintenance database's
 * `tickets` collection — kept separate from
 * autonomous/analytics so a future Maintenance
 * agent (and the eventual Maintenance page)
 * has its own isolated store with its own
 * permissions.
 */
function getCollection() {
  return getMaintenanceDB().collection("tickets");
}


async function createMaintenanceTicket(
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
  createMaintenanceTicket,
};
