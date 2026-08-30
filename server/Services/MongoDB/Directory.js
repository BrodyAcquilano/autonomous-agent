import { getDB } from "./MongoDB.js";


function getCollection() {
  return getDB().collection("directory");
}


/*
 * The directory collection is one flat
 * collection holding three kinds of documents,
 * distinguished by `type`, forming a three-layer
 * structural tensor (Agent -> Contact -> Request
 * Types) — see docs/architecture/
 * 03-agent-organization.md. Unlike the
 * Capabilities Brain (separate collections per
 * layer), this is small enough to load in one
 * query and index by type here, once, so the
 * frontend never has to re-filter the whole
 * collection itself.
 */
async function getDirectoryIndex() {
  const entries =
    await getCollection()
      .find({})
      .sort({
        createdAt: 1,
      })
      .toArray();


  return {
    agents:
      entries.filter(
        (entry) =>
          entry.type ===
          "agent",
      ),

    contacts:
      entries.filter(
        (entry) =>
          entry.type ===
          "contact",
      ),

    requestTypes:
      entries.filter(
        (entry) =>
          entry.type ===
          "request_types",
      ),
  };
}


export {
  getDirectoryIndex,
};
