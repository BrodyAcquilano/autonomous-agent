/*
 * Five connections for now — the direct frontend-to-
 * server calls that don't go through the Router/Worker
 * pipeline. Maintenance.jsx has two: restarting a ticket
 * (`request-maintenance`) and its own logs/tickets CRUD
 * (`maintenance-crud`, which includes the narrower ticket-
 * only cascade). Analytics.jsx has one (`analytics-crud`),
 * which does the broader cascade across both databases.
 * `app.jsx`'s own Capabilities/Org Brain + Maintenance/
 * Analytics loading is a separate connection set for
 * later, not drawn here yet.
 *
 * A connection targets the ROUTE box specifically (not the
 * client box above it, unlike the database connections) —
 * Frontend sits below Server in the grid, so it enters
 * through the route's bottom edge, the side facing it.
 */
const FRONTEND_TO_SERVER_ROUTE_PAIRS = [
  { frontendId: "caller-console-shell", routeId: "route-request-service" },
  { frontendId: "caller-output-hook", routeId: "route-azure-proxy" },
  { frontendId: "caller-maintenance-handlers", routeId: "route-request-maintenance" },
  { frontendId: "caller-maintenance-handlers", routeId: "route-maintenance-crud" },
  { frontendId: "caller-analytics-handler", routeId: "route-analytics-crud" },
];

/*
 * Each line is a three-segment orthogonal path: up from
 * the caller's top-edge midpoint to the halfway point
 * between it and the route box, across (left or right,
 * whichever the route box's position actually calls for —
 * plain coordinate subtraction, so this stays correct if
 * either box ever moves) to the route box's horizontal
 * center, then up the rest of the way to its bottom edge.
 * `frontendBoxes` / `serverBoxes` are both already in the
 * SAME shared (canvas) coordinate space by the time they
 * reach here.
 */
function FrontendToServerConnections({ frontendBoxes, serverBoxes }) {
  return (
    <g className="sysdiag-connections-frontend-server">
      {FRONTEND_TO_SERVER_ROUTE_PAIRS.map(({ frontendId, routeId }) => {
        const frontendBox = frontendBoxes[frontendId];
        const routeBox = serverBoxes[routeId];

        if (!frontendBox || !routeBox) {
          return null;
        }

        const startX = frontendBox.x + (frontendBox.width / 2);
        const startY = frontendBox.y;

        const endX = routeBox.x + (routeBox.width / 2);
        const endY = routeBox.y + routeBox.height;

        const midY = (startY + endY) / 2;

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
