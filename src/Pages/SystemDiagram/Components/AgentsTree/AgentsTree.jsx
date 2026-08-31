import useTreeGeometry from "../../useTreeGeometry";

import "./AgentsTree.css";

/*
 * A chevron, not a plain pyramid. Router and Worker
 * (layer 1 — the ones closer to the Server below this
 * tree) flank an open gap in the middle of their row.
 * Analyst and Maintenance (layer 2 — farther from the
 * Server) sit centered above that gap, so a connection
 * from either of them straight down to the Server
 * passes cleanly through the gap instead of crossing
 * Router or Worker. That gap exists because both the
 * Server AND Router/Worker sometimes need to reach
 * Analyst/Maintenance directly, not just through one
 * another.
 *
 * Sits in row 1, its own row, spanning as wide as it
 * needs — a long horizontal strip rather than a square,
 * which leaves room to add more agents later without
 * needing to rework the shape.
 */
function AgentBox({ id, title, lines, registerBox }) {
  return (
    <div ref={registerBox(id)} className={`sysdiag-agents-box sysdiag-agents-box-${id}`}>
      <div className="sysdiag-agents-box-title">{title}</div>
      {lines.map((line) => (
        <div key={line} className="sysdiag-agents-box-line">
          {line}
        </div>
      ))}
    </div>
  );
}

function AgentsTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  return (
    <div ref={contentRef} className="sysdiag-agents-tree">
      <div className="sysdiag-agents-label">
        AZURE OPENAI
        <span className="sysdiag-agents-label-sub">
          every agent below is a configured call into this, not separate infrastructure
        </span>
      </div>

      <div className="sysdiag-agents-layer2">
        <AgentBox
          id="analyst"
          title="ANALYST AGENT"
          lines={["Reviews each Router stage,", "read-only. Logs a concern —", "never files a ticket itself."]}
          registerBox={registerBox}
        />
        <AgentBox
          id="maintenance"
          title="MAINTENANCE AGENT"
          lines={["Sole ticket authority.", "Only agent with any DB", "write access (patch on", "ticket restart only)."]}
          registerBox={registerBox}
        />
      </div>

      <div className="sysdiag-agents-layer1">
        <AgentBox
          id="router"
          title="ROUTER AGENT"
          lines={["Model → API → Tool →", "Capability decision.", "Reports an error if it", "can't decide."]}
          registerBox={registerBox}
        />
        <div className="sysdiag-agents-gap" aria-hidden="true" />
        <AgentBox
          id="worker"
          title="TEMP WORKER"
          lines={["Executes the resolved", "route. No reasoning, no", "permanent config."]}
          registerBox={registerBox}
        />
      </div>
    </div>
  );
}

export default AgentsTree;
