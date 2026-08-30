import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";
import { getDefaultPlatform } from "./Platforms.js";


function getCollection() {
  return getDB().collection("apis");
}


async function getAllApis({ model } = {}) {
  const filter = {};

  if (model) {
    if (!ObjectId.isValid(model)) {
      return [];
    }

    filter.model = new ObjectId(model);
  }

  return getCollection()
    .find(filter)
    .sort({ name: 1 })
    .toArray();
}


async function getApiById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getCollection().findOne({
    _id: new ObjectId(id),
  });
}


/*
 * Same convention as insertModel in Models.js —
 * used by the Maintenance agent's Capabilities
 * Brain patch (applyCapabilitiesBrainPatch in
 * MaintenanceAgent.js).
 */
async function insertApi(api) {
  const platform = await getDefaultPlatform();

  const document = {
    ...api,

    platform: platform?._id || null,
    platformName: platform?.name || null,

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
  getAllApis,
  getApiById,
  insertApi,
};
