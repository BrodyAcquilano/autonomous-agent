/*
 * Every database collection that the Server actually reads
 * or writes directly (not agent-facing traffic, which is a
 * separate connection layer). The six Capabilities/
 * Organizational Brain collections each have their own
 * dedicated route+client column, so those are a clean 1:1
 * map; the five maintenance collections and two analytics
 * collections still share one combined route+client column
 * each, so those fan in — multiple collections' lines
 * converging on the same `maintenance-crud`/`analytics-crud`
 * client box, same as that one box already represents CRUD
 * across all of that database's collections collectively.
 *
 * A connection targets the CLIENT box specifically (the
 * `clients-<routeId>` box `ServerTree` registers), not the
 * route label beneath it — the client is the thing making
 * the call; the route is just the code it lives inside.
 */
const COLLECTION_TO_SERVER_CLIENT = {
  "collection-autonomous-models": "clients-models-crud",
  "collection-autonomous-apis": "clients-apis-crud",
  "collection-autonomous-tools": "clients-tools-crud",
  "collection-autonomous-capabilities": "clients-capabilities-crud",
  "collection-autonomous-agents": "clients-agents-crud",
  "collection-autonomous-directory": "clients-directory-crud",

  "collection-maintenance-router": "clients-maintenance-crud",
  "collection-maintenance-analyst": "clients-maintenance-crud",
  "collection-maintenance-worker": "clients-maintenance-crud",
  "collection-maintenance-maintenance": "clients-maintenance-crud",
  "collection-maintenance-tickets": "clients-maintenance-crud",

  "collection-analytics-router": "clients-analytics-crud",
  "collection-analytics-worker": "clients-analytics-crud",
};

/*
 * Each line is a two-segment orthogonal path: out
 * horizontally from the collection's LEFT-edge midpoint
 * (Database sits on the right side of the grid now, with
 * its collections left-aligned to face Server) to the
 * client box's horizontal center, then a second segment
 * vertically down to the client box's top edge.
 * `databaseBoxes` / `serverBoxes` are both already in the
 * SAME shared (canvas) coordinate space by the time they
 * reach here.
 */
function DatabaseToServerConnections({ databaseBoxes, serverBoxes }) {
  return (
    <g className="sysdiag-connections-database-server">
      {Object.entries(COLLECTION_TO_SERVER_CLIENT).map(([collectionId, clientId]) => {
        const collectionBox = databaseBoxes[collectionId];
        const clientBox = serverBoxes[clientId];

        if (!collectionBox || !clientBox) {
          return null;
        }

        const startX = collectionBox.x;
        const startY = collectionBox.y + (collectionBox.height / 2);

        const endX = clientBox.x + (clientBox.width / 2);
        const endY = clientBox.y;

        return (
          <path
            key={collectionId}
            className="sysdiag-connection-path"
            d={`M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`}
          />
        );
      })}
    </g>
  );
}

export default DatabaseToServerConnections;
