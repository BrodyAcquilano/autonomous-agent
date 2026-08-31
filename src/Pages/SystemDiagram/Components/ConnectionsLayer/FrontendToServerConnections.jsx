/*
 * Two groups of direct frontend-to-server calls (nothing
 * here goes through the Router/Worker pipeline): the
 * callers (CommandShell, useResponseOutput, a page's own
 * action handler) and App.jsx's own loading hooks — both
 * are just "frontendId" entries in the same list, since a
 * hook box is measured and registered exactly like a
 * caller box is.
 *
 * Maintenance.jsx's caller has two: restarting a ticket
 * (`request-maintenance`) and its own logs/tickets CRUD
 * (`maintenance-crud`, the narrower ticket-only cascade).
 * Analytics.jsx's caller has one (`analytics-crud`), the
 * broader cascade across both databases. The Capabilities
 * loading hook fans out to all four Capabilities Brain
 * routes, since it's the one hook that populates all of
 * models/apis/tools/capabilities together; every other
 * loading hook maps 1:1 to the one route it reads.
 *
 * A connection targets the ROUTE box specifically (not the
 * client box above it, unlike the database connections) —
 * Frontend sits below Server in the grid, so it enters
 * through the route's bottom edge, the side facing it.
 *
 * `crossingFraction` is an explicit, hand-picked height
 * (0 = the frontend box's own edge, 1 = the route box's
 * edge) for the middle, horizontal segment of that
 * connection's path — not computed from direction or
 * position. Every connection here targets one exact,
 * fixed pair of boxes, so there's nothing to derive: where
 * two or more lines would otherwise cross the same
 * horizontal band at the same height, each gets its own
 * band instead, picked by hand and confirmed by eye.
 * Console/Output and the Agents/Directory hooks don't
 * need one — nothing else crosses their path — so they're
 * left at the default halfway point.
 */
const FRONTEND_TO_SERVER_ROUTE_PAIRS = [
  { frontendId: "caller-console-shell", routeId: "route-request-service", crossingFraction: 0.5 },
  { frontendId: "caller-output-hook", routeId: "route-azure-proxy", crossingFraction: 0.5 },
  { frontendId: "caller-maintenance-handlers", routeId: "route-request-maintenance", crossingFraction: 0.2 },
  { frontendId: "caller-maintenance-handlers", routeId: "route-maintenance-crud", crossingFraction: 0.2 },
  { frontendId: "caller-analytics-handler", routeId: "route-analytics-crud", crossingFraction: 0.3 },

  { frontendId: "hook-capabilities", routeId: "route-models-crud", crossingFraction: 0.7 },
  { frontendId: "hook-capabilities", routeId: "route-apis-crud", crossingFraction: 0.7 },
  { frontendId: "hook-capabilities", routeId: "route-tools-crud", crossingFraction: 0.7 },
  { frontendId: "hook-capabilities", routeId: "route-capabilities-crud", crossingFraction: 0.7 },
  { frontendId: "hook-agents", routeId: "route-agents-crud", crossingFraction: 0.5 },
  { frontendId: "hook-directory", routeId: "route-directory-crud", crossingFraction: 0.5 },
  { frontendId: "hook-maintenance", routeId: "route-maintenance-crud", crossingFraction: 0.5 },
  { frontendId: "hook-analytics", routeId: "route-analytics-crud", crossingFraction: 0.6 },
];

/*
 * Each line is a three-segment orthogonal path: up from
 * the frontend box's top-edge midpoint to its own
 * `crossingFraction` height, across to the route box's
 * horizontal center, then up the rest of the way to its
 * bottom edge. `frontendBoxes` / `serverBoxes` are both
 * already in the SAME shared (canvas) coordinate space by
 * the time they reach here.
 */
function FrontendToServerConnections({ frontendBoxes, serverBoxes }) {
  return (
    <g className="sysdiag-connections-frontend-server">
      {FRONTEND_TO_SERVER_ROUTE_PAIRS.map(({ frontendId, routeId, crossingFraction }) => {
        const frontendBox = frontendBoxes[frontendId];
        const routeBox = serverBoxes[routeId];

        if (!frontendBox || !routeBox) {
          return null;
        }

        const startX = frontendBox.x + (frontendBox.width / 2);
        const startY = frontendBox.y;

        const endX = routeBox.x + (routeBox.width / 2);
        const endY = routeBox.y + routeBox.height;

        const midY = startY + ((endY - startY) * crossingFraction);

        return (
          <path
            key={`${frontendId}::${routeId}`}
            className="sysdiag-connection-path"
            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
          />
        );
      })}
    </g>
  );
}

export default FrontendToServerConnections;
