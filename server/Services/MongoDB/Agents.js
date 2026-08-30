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


export {
  getAgentByName,
};
