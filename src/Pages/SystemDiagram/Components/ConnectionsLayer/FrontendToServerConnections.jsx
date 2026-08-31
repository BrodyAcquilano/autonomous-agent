/*
 * Two groups of direct frontend-to-server calls (nothing
 * here goes through the Router/Worker pipeline): the
 * callers (CommandShell, useResponseOutput, a page's own
 * action handler) and App.jsx's own loading hooks — both
 * are just "frontendId" entries in the same list, since a
 * hook box is measured and registered exactly like a
 * caller box is.
 *
 * Maintenance.jsx has FIVE separate callers, not one shared
 * one (see FrontendTree.jsx's `PAGE_COMPONENTS.maintenance`):
 * `caller-maintenance-submit-request` (`handleSubmitMaintenanceRequest()`)
 * is the only one that reaches `request-maintenance`; the other
 * three DB-CRUD ones — `caller-maintenance-ignore`
 * (`handleIgnore()`), `caller-maintenance-mark-reviewed`
 * (`handleMarkReviewed()`), and `caller-maintenance-delete-log`
 * (`handleDeleteLog()`) — all reach `maintenance-crud`, so they
 * share a route the same way hook-analytics/caller-analytics-handler
 * do, and each needs its own `crossingFraction` band for exactly
 * that reason. `caller-maintenance-restart` (`handleRestart()`)
 * is the fifth, and the odd one out structurally: it actually
 * calls `requestServiceApi`, reaching `request-service` — a
 * route on the OPPOSITE side of Server's row from Maintenance's
 * own column — so it isn't in this list at all; see
 * `RESTART_TO_REQUEST_SERVICE_PATH` and the dedicated rendering
 * for it below. Analytics.jsx's caller is `handleDelete()`
 * (`analytics-crud`), the broader cascade across both
 * databases. The Capabilities
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
  { frontendId: "caller-maintenance-submit-request", routeId: "route-request-maintenance", crossingFraction: 0.1 },
  { frontendId: "caller-maintenance-ignore", routeId: "route-maintenance-crud", crossingFraction: 0.125 },
  { frontendId: "caller-maintenance-mark-reviewed", routeId: "route-maintenance-crud", crossingFraction: 0.15 },
  { frontendId: "caller-maintenance-delete-log", routeId: "route-maintenance-crud", crossingFraction: 0.175 },
  { frontendId: "caller-analytics-handler", routeId: "route-analytics-crud", crossingFraction: 0.25 },

  { frontendId: "hook-capabilities", routeId: "route-models-crud", crossingFraction: 0.6 },
  { frontendId: "hook-capabilities", routeId: "route-apis-crud", crossingFraction: 0.6 },
  { frontendId: "hook-capabilities", routeId: "route-tools-crud", crossingFraction: 0.6 },
  { frontendId: "hook-capabilities", routeId: "route-capabilities-crud", crossingFraction: 0.6 },
  { frontendId: "hook-agents", routeId: "route-agents-crud", crossingFraction: 0.75 },
  { frontendId: "hook-directory", routeId: "route-directory-crud", crossingFraction: 0.5 },
  { frontendId: "hook-maintenance", routeId: "route-maintenance-crud", crossingFraction: 0.425 },
  { frontendId: "hook-analytics", routeId: "route-analytics-crud", crossingFraction: 0.475 },
];

/*
 * `handleRestart()` is the one connection that can't just go
 * straight up: its box sits in Maintenance's column, at the far
 * RIGHT of Frontend's row, but the route it actually calls
 * (`request-service`) sits at the far LEFT of Server's row — a
 * straight or simple dog-leg line would cut across every other
 * box and connection in between. Instead it drops DOWN from its
 * own box into the blank row below the hooks
 * (`.sysdiag-frontend-app-bottom-gap`), travels LEFT through
 * that row and up through `.sysdiag-frontend-app-box`'s widened
 * left padding — a lane nothing else occupies. From there it
 * rises only to `sharedY`, the SAME crossing height
 * `caller-console-shell`'s own connection bends at (halfway
 * between Console's caller box's top edge and request-service's
 * bottom edge — that connection's `crossingFraction` is 0.5, so
 * this is that same midpoint, computed independently here rather
 * than shared code, since it's one specific fixed geometric
 * fact, not a general rule), then cuts right STRAIGHT to
 * request-service's own actual center and rises the rest of the
 * way from there — the same final point and final segment
 * Console's own line arrives at and rises through. Earlier
 * versions of this also routed through Console's own caller box
 * center (`consoleStartX`) as an extra waypoint first, on the
 * assumption it sits left of request-service's center — it
 * doesn't (Console's box is wider), so that extra stop overshot
 * PAST request-service's center and doubled back to it, drawing
 * the same stretch of line twice. Going directly to
 * request-service's center avoids that entirely, and still
 * merges with Console's line for the one segment that matters —
 * the shared final rise into request-service.
 *
 * `laneX` is hand-picked, not measured — it just needs to land
 * inside that left padding lane (`app` is FrontendTree's own
 * outer box, registered via `registerBox("app")`). `dropY` IS
 * measured, deliberately, rather than a fixed pixel offset: it's
 * 75% of the way down from the restart box's own bottom edge to
 * App.jsx's own bottom edge — deep into the bottom gap row — so
 * it scales with however tall that row actually renders instead
 * of a guessed constant.
 */
function buildRestartPath(restartBox, appBox, consoleBox, routeBox) {
  const startX = restartBox.x + (restartBox.width / 2);
  const startY = restartBox.y + restartBox.height;

  const appBottomY = appBox.y + appBox.height;
  const dropY = startY + ((appBottomY - startY) * 0.75);

  const laneX = appBox.x + 15;

  const consoleStartY = consoleBox.y;

  const endX = routeBox.x + (routeBox.width / 2);
  const endY = routeBox.y + routeBox.height;
  const sharedY = consoleStartY + ((endY - consoleStartY) * 0.5);

  return `M ${startX} ${startY} L ${startX} ${dropY} L ${laneX} ${dropY} L ${laneX} ${sharedY} L ${endX} ${sharedY} L ${endX} ${endY}`;
}

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
  const restartBox = frontendBoxes["caller-maintenance-restart"];
  const appBox = frontendBoxes.app;
  const consoleBox = frontendBoxes["caller-console-shell"];
  const restartRouteBox = serverBoxes["route-request-service"];

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

      {restartBox && appBox && consoleBox && restartRouteBox && (
        <path
          key="caller-maintenance-restart::route-request-service"
          className="sysdiag-connection-path"
          d={buildRestartPath(restartBox, appBox, consoleBox, restartRouteBox)}
        />
      )}
    </g>
  );
}

export default FrontendToServerConnections;
