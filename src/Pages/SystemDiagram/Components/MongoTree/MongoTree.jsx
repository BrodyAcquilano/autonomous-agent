import useTreeGeometry from "../../useTreeGeometry";

import "./MongoTree.css";

/*
 * A plain pyramid, not a chevron — unlike the Agents
 * or Frontend trees, nothing else ever needs to reach
 * PAST a collection to get to something deeper, so
 * there's no gap to leave room for. Containment alone
 * (cluster > database > collections) already tells the
 * whole routing story: the server always asks for one
 * specific collection directly. Collections sit
 * left-aligned within their database, so the
 * "innermost" layer visually sits closest to the rest
 * of the diagram (the Server, to this tree's left — the
 * tree lives on the right side of the grid).
 *
 * Only collection boxes are tracked for geometry — a
 * connection here only ever targets one specific
 * collection directly, never a database or the cluster
 * itself, so that's all the page needs positions for.
 */
function CollectionBox({ id, name, registerBox }) {
  return (
    <div ref={registerBox(id)} className="sysdiag-mongo-collection">
      {name}
    </div>
  );
}

function CollectionGroup({ dbName, title, items, registerBox }) {
  return (
    <div className="sysdiag-mongo-collection-group">
      <div className="sysdiag-mongo-collection-group-title">
        {title}
      </div>
      <div className="sysdiag-mongo-collection-list">
        {items.map((name) => (
          <CollectionBox key={name} id={`collection-${dbName}-${name}`} name={name} registerBox={registerBox} />
        ))}
      </div>
    </div>
  );
}

function DatabaseBox({ name, children }) {
  return (
    <div className="sysdiag-mongo-database">
      <div className="sysdiag-mongo-database-title">
        {name}
      </div>
      <div className="sysdiag-mongo-database-inner">
        {children}
      </div>
    </div>
  );
}

function MongoTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  return (
    <div ref={contentRef} className="sysdiag-mongo-tree">
      <div className="sysdiag-mongo-label">MONGODB</div>

      <div className="sysdiag-mongo-cluster">
        <div className="sysdiag-mongo-cluster-title">cluster (Atlas)</div>

        <div className="sysdiag-mongo-databases">
          <DatabaseBox name="autonomous">
            <CollectionGroup
              dbName="autonomous"
              title="Organizational Brain"
              items={["directory", "agents"]}
              registerBox={registerBox}
            />
            <CollectionGroup
              dbName="autonomous"
              title="Capabilities Brain"
              items={["models", "apis", "tools", "capabilities", "platforms"]}
              registerBox={registerBox}
            />
          </DatabaseBox>

          <DatabaseBox name="analytics">
            <CollectionGroup dbName="analytics" title="" items={["router", "worker"]} registerBox={registerBox} />
          </DatabaseBox>

          <DatabaseBox name="maintenance">
            <CollectionGroup
              dbName="maintenance"
              title=""
              items={["router", "analyst", "worker", "maintenance", "tickets"]}
              registerBox={registerBox}
            />
          </DatabaseBox>
        </div>
      </div>
    </div>
  );
}

export default MongoTree;
