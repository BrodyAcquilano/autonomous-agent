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
 * way no existing capability covers. Router-
 * suggested capabilities are saved so the
 * library grows over time, but are flagged
 * distinctly so Maintenance can later review
 * them separately from human-authored ones.
 */
async function insertCapability(capability) {
  const document = {
    ...capability,

    status: "SUPPORTED",
    version: 1,

    origin: "router-suggested",
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
