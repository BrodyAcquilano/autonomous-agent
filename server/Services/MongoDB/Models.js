import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";
import { getDefaultPlatform } from "./Platforms.js";


function getCollection() {
  return getDB().collection("models");
}


async function getAllModels() {
  return getCollection()
    .find({})
    .sort({ name: 1 })
    .toArray();
}


async function getModelById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getCollection().findOne({
    _id: new ObjectId(id),
  });
}


/*
 * Used when the Maintenance agent patches the
 * Capabilities Brain with a model a human has
 * already approved and configured the real
 * Azure deployment for (see
 * applyCapabilitiesBrainPatch in
 * MaintenanceAgent.js). `origin`/`reviewStatus`
 * mirror the same convention already used for
 * Router-suggested capabilities (insertCapability
 * in Capabilities.js) -- immediately usable
 * (`status: "SUPPORTED"`), but flagged so a human
 * can review it later without that review
 * blocking the Router from picking it up right
 * away.
 */
async function insertModel(model) {
  const platform = await getDefaultPlatform();

  const document = {
    ...model,

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
  getAllModels,
  getModelById,
  insertModel,
};
