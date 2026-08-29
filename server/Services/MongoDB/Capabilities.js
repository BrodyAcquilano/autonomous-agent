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


export {
  getAllCapabilities,
  getCapabilityById,
};
