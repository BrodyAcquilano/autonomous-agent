import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";


function getCollection() {
  return getDB().collection("tools");
}


async function getAllTools({ model, api } = {}) {
  const filter = {};

  if (model) {
    if (!ObjectId.isValid(model)) {
      return [];
    }

    filter.model = new ObjectId(model);
  }

  if (api) {
    if (!ObjectId.isValid(api)) {
      return [];
    }

    filter.api = new ObjectId(api);
  }

  return getCollection()
    .find(filter)
    .sort({ name: 1 })
    .toArray();
}


async function getToolById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getCollection().findOne({
    _id: new ObjectId(id),
  });
}


/*
 * Same convention as insertModel/insertApi --
 * used by the Maintenance agent's Capabilities
 * Brain patch (applyCapabilitiesBrainPatch in
 * MaintenanceAgent.js). Tools have no platform
 * field of their own (see the code-interpreter
 * document shape) -- they only ever reference a
 * model + api, both already resolved by the
 * caller.
 */
async function insertTool(tool) {
  const document = {
    ...tool,

    status: "SUPPORTED",
    version: 1,

    origin: "maintenance-authored",
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
  getAllTools,
  getToolById,
  insertTool,
};
