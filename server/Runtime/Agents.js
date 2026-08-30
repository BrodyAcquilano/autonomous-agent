import {
  getAgentByName,
} from "../Services/MongoDB/Agents.js";


/*
 * Permanent, in-memory agent registry.
 *
 * The Router and Analyst are standing agents —
 * their identity (the `agents` collection
 * profile-card document, whose contentMarkdown
 * IS the system prompt sent on every reasoning
 * call) does not change between requests, so it
 * is fetched from MongoDB exactly once, at
 * server startup, and kept alive here for the
 * life of the process — not re-fetched on every
 * single API call the way it was before this
 * module existed. This is what "the company
 * keeps its agents awake" means in practice
 * today: there is no separate conversation state
 * or memory to keep alive yet, only the identity
 * each one reasons from, but the same cache is
 * where that would live once it exists.
 *
 * The Worker's profile is cached here too, for
 * consistency and so a future Maintenance/
 * directory view can read it without its own
 * MongoDB round trip, even though — unlike the
 * other two — it is never loaded as an
 * instructions prompt anywhere (see
 * server/Services/Router/TempWorker.js). The
 * Worker has no other meaningful "instance"
 * state: it takes a fully-resolved route as
 * arguments and executes it fresh every call, so
 * there is nothing else to keep alive for it.
 */
const ROUTER_AGENT_NAME =
  "router";

const ANALYST_AGENT_NAME =
  "analyst";

const WORKER_AGENT_NAME =
  "worker";

const MAINTENANCE_AGENT_NAME =
  "maintenance";


let cache =
  null;


async function initAgents() {
  const [
    router,
    analyst,
    worker,
    maintenance,
  ] =
    await Promise.all(
      [
        getAgentByName(
          ROUTER_AGENT_NAME,
        ),
        getAgentByName(
          ANALYST_AGENT_NAME,
        ),
        getAgentByName(
          WORKER_AGENT_NAME,
        ),
        getAgentByName(
          MAINTENANCE_AGENT_NAME,
        ),
      ],
    );


  if (
    !router
  ) {
    throw new Error(
      `Agent profile "${ROUTER_AGENT_NAME}" is not configured in the agents collection.`,
    );
  }


  cache =
    {
      router,
      analyst,
      worker,
      maintenance,
    };


  return cache;
}


function requireCache() {
  if (
    !cache
  ) {
    throw new Error(
      "Agent runtime is not initialized. Call initAgents() during server startup before handling requests.",
    );
  }


  return cache;
}


function getRouterAgentProfile() {
  return requireCache().router;
}


/*
 * Unlike the Router, a missing Analyst profile
 * is not fatal at startup — AnalystAgent.js
 * already fails open (lets the run continue
 * unreviewed) when this returns null, the same
 * behavior it had when it fetched the profile
 * itself on every call.
 */
function getAnalystAgentProfile() {
  return requireCache().analyst;
}


function getWorkerAgentProfile() {
  return requireCache().worker;
}


/*
 * Not fatal at startup, same reasoning as the
 * Analyst — the Maintenance agent is being
 * bootstrapped in stages (see docs/architecture/
 * 06-maintenance.md), so its own service fails
 * with a clear error only when it is actually
 * invoked without a configured profile, rather
 * than blocking the whole server from starting.
 */
function getMaintenanceAgentProfile() {
  return requireCache().maintenance;
}


export {
  initAgents,
  getRouterAgentProfile,
  getAnalystAgentProfile,
  getWorkerAgentProfile,
  getMaintenanceAgentProfile,
};
