import { ObjectId } from "mongodb";

import { getDB } from "./MongoDB.js";


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


export {
  getAllModels,
  getModelById,
};
