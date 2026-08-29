import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";


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


export {
  getAllApis,
  getApiById,
};
