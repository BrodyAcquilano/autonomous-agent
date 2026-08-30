import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";


function getCollection() {
  return getDB().collection("capabilities");
}


async function getAllCapabilities({ tool } = {}) {
  const filter = {};

  if (tool) {
    if (!ObjectId.isValid(tool)) {
      return [];
    }

    filter.tool = new ObjectId(tool);
  }

  return getCollection()
    .find(filter)
    .sort({ name: 1 })
    .toArray();
}


async function getCapabilityById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getCollection().findOne({
    _id: new ObjectId(id),
  });
}


/*
 * Used when the Router configures a tool in a
 * way no existing capability covers, or when the
 * Maintenance agent patches in a capability as
 * part of a Capabilities Brain patch (see
 * applyCapabilitiesBrainPatch in
 * MaintenanceAgent.js) -- `origin` distinguishes
 * the two so a human reviewing later knows whose
 * judgment produced it. Either way it is saved
 * immediately usable (`status: "SUPPORTED"`) but
 * flagged `reviewStatus: "pending"` so it can be
 * reviewed separately from human-authored ones
 * without that review blocking the Router from
 * picking it up right away.
 */
async function insertCapability(capability, origin = "router-suggested") {
  const document = {
    ...capability,

    status: "SUPPORTED",
    version: 1,

    origin,
    reviewStatus: "pending",

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await getCollection().insertOne(document);

  return {
    ...document,
    _id: result.insertedId,
  };
}


export {
  getAllCapabilities,
  getCapabilityById,
  insertCapability,
};
