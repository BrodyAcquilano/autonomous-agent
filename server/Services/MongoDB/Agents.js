import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";


function getCollection() {
  return getDB().collection("agents");
}


async function getAgentByName(
  name,
) {
  return getCollection().findOne({
    name,
  });
}


/*
 * For the Agents page (a "Team" page, not part
 * of the Capabilities Brain funnel) — agent
 * profile documents are a flat vector, not
 * linked to anything else, so unlike
 * models/apis/tools this never takes a scoping
 * filter.
 */
async function getAllAgents() {
  return getCollection()
    .find({})
    .sort({ name: 1 })
    .toArray();
}


async function getAgentById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getCollection().findOne({
    _id: new ObjectId(id),
  });
}


export {
  getAgentByName,
  getAllAgents,
  getAgentById,
};
