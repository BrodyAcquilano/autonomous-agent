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


export {
  getAllTools,
  getToolById,
};
