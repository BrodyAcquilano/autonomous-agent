import { getDB } from "./MongoDB.js";


function getCollection() {
  return getDB().collection("platforms");
}


/*
 * There is currently only ever one platform
 * (azure-openai-foundry) — no route or agent
 * picks between several, so a new Model/API
 * document being written just needs to attach
 * to whichever one exists rather than being
 * asked to choose. No full CRUD service exists
 * for platforms yet because nothing needs one.
 */
async function getDefaultPlatform() {
  return getCollection().findOne({});
}


export { getDefaultPlatform };
