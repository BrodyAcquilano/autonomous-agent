import useTreeGeometry from "../../useTreeGeometry";

import "./ServerTree.css";

/*
 * Drawn upside down on purpose: clients (the actual
 * decisions/calls a route makes) sit on TOP, and the
 * Express route each one lives inside sits BELOW it —
 * "clients down to routes," not the other way around. A
 * connection to the database targets the CLIENT box, not
 * the route label beneath it — the client is what makes
 * the decision to call, the route is just what it lives
 * inside (see the directory-attribution convention this
 * whole app follows). Most agent-facing routes sit on the
 * left (near the Agents tree) and database-facing routes
 * on the right (near the Database tree); `request-
 * maintenance` is the one exception, pushed to the very
 * end since nothing else needs to connect to it.
 *
 * One API, one collection: the routes that read the
 * Capabilities Brain and Organizational Brain used to be
 * bundled into two combined boxes; each now gets its own
 * column, so every one of them lines up 1:1 with exactly
 * one collection in the Mongo tree. Both groups are still
 * wrapped in a labeled boundary box, matching how the
 * Mongo tree groups its own collections.
 *
 * The whole row is a left-right mirror of the Mongo tree,
 * since Database now sits on the right side of the grid
 * and Server in the middle: every route here is ordered
 * the REVERSE of how its matching collection is listed in
 * the Mongo tree (which reads top-to-bottom; this reads
 * left-to-right) — both which group comes first AND each
 * group's own internal order — so the connections between
 * the two trees nest cleanly instead of crossing.
 */
const DATABASE_ROUTES = [
  { id: "analytics-crud", label: "/api/analytics", clients: ["logs CRUD", "cascade delete"] },
  { id: "maintenance-crud", label: "/api/maintenance", clients: ["tickets + logs CRUD"] },
];

const CAPABILITIES_GROUP_ROUTES = [
  { id: "models-crud", label: "/api/models", clients: ["read models"] },
  { id: "apis-crud", label: "/api/apis", clients: ["read apis"] },
  { id: "tools-crud", label: "/api/tools", clients: ["read tools"] },
  { id: "capabilities-crud", label: "/api/capabilities", clients: ["read capabilities"] },
];

const ORGANIZATIONAL_GROUP_ROUTES = [
  { id: "directory-crud", label: "/api/directory", clients: ["read directory"] },
  { id: "agents-crud", label: "/api/agents", clients: ["read agents"] },
];

const AGENT_ROUTES = [
  { id: "request-service", label: "POST /api/request-service", clients: ["callRouterStage()", "reviewRouterStage()", "executeRoute()", "helpRecoverFromError()"] },
  { id: "azure-proxy", label: "/api/azure/*", clients: ["createResponse() proxy", "getContainerFileContent()"] },
];

const REQUEST_MAINTENANCE_ROUTE = {
  id: "request-maintenance",
  label: "POST /api/request-maintenance",
  clients: ["runMaintenanceSweep()"],
};

function RouteColumn({ route, registerBox }) {
  return (
    <div className={`sysdiag-server-column sysdiag-server-column-${route.id}`}>
      <div ref={registerBox(`clients-${route.id}`)} className="sysdiag-server-clients">
        {route.clients.map((client) => (
          <div key={client} ref={registerBox(`client-${route.id}-${client}`)} className="sysdiag-server-client">
            {client}
          </div>
        ))}
      </div>

      <div ref={registerBox(`route-${route.id}`)} className="sysdiag-server-route">{route.label}</div>
    </div>
  );
}

function RouteGroup({ title, routes, registerBox }) {
  return (
    <div className="sysdiag-server-group">
      <div className="sysdiag-server-group-title">{title}</div>
      <div className="sysdiag-server-group-columns">
        {routes.map((route) => (
          <RouteColumn key={route.id} route={route} registerBox={registerBox} />
        ))}
      </div>
    </div>
  );
}

function ServerTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  return (
    <div ref={contentRef} className="sysdiag-server-tree">
      <div className="sysdiag-server-label">SERVER (Express)</div>

      <div className="sysdiag-server-columns">
        {AGENT_ROUTES.map((route) => (
          <RouteColumn key={route.id} route={route} registerBox={registerBox} />
        ))}

        <RouteGroup title="Organizational Brain" routes={ORGANIZATIONAL_GROUP_ROUTES} registerBox={registerBox} />
        <RouteGroup title="Capabilities Brain" routes={CAPABILITIES_GROUP_ROUTES} registerBox={registerBox} />

        {DATABASE_ROUTES.map((route) => (
          <RouteColumn key={route.id} route={route} registerBox={registerBox} />
        ))}

        <RouteColumn route={REQUEST_MAINTENANCE_ROUTE} registerBox={registerBox} />
      </div>
    </div>
  );
}

export default ServerTree;
