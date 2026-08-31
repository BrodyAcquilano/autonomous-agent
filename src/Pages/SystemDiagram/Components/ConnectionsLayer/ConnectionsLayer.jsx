import DatabaseToServerConnections from "./DatabaseToServerConnections";
import FrontendToServerConnections from "./FrontendToServerConnections";

import "./ConnectionsLayer.css";

/*
 * One absolute overlay, sized to match the canvas exactly
 * (see its CSS) and sitting on top of the grid — every
 * connection sub-layer renders into it as its own <g>, so
 * they all share one coordinate space and one SVG. Split
 * by which two trees a connection runs between, same as
 * the grid itself is split into trees — agent-facing
 * connections (Agents <-> Server, App.jsx <-> Server) are
 * future additions to this same component.
 */
function ConnectionsLayer({ mongoBoxes, serverBoxes, frontendBoxes }) {
  return (
    <svg className="sysdiag-connections-layer" aria-hidden="true">
      <DatabaseToServerConnections databaseBoxes={mongoBoxes} serverBoxes={serverBoxes} />
      <FrontendToServerConnections frontendBoxes={frontendBoxes} serverBoxes={serverBoxes} />
    </svg>
  );
}

export default ConnectionsLayer;
