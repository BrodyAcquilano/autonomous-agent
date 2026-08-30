import "./FilterPanel.css";


function FilterPanel({
  agents,
  agentFilter,
  setAgentFilter,
  logCount,
}) {
  return (
    <aside
      className="analytics-filter-panel"
      aria-label="Analytics filters"
    >
      <div className="analytics-filter-section">
        <div className="analytics-filter-title">
          AGENT
        </div>

        <div className="analytics-filter-options">
          <button
            type="button"
            className={
              agentFilter ===
              "all"
                ? "active"
                : ""
            }
            onClick={() => {
              setAgentFilter(
                "all",
              );
            }}
          >
            ALL AGENTS
          </button>

          {agents.map(
            (
              agent,
            ) => (
              <button
                key={
                  agent.name
                }
                type="button"
                className={
                  agentFilter ===
                  agent.name
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setAgentFilter(
                    agent.name,
                  );
                }}
              >
                {agent.displayName ||
                  agent.name}
              </button>
            ),
          )}
        </div>


        <div className="analytics-filter-count">
          {logCount}
          {" "}
          {logCount ===
          1
            ? "LOG ENTRY"
            : "LOG ENTRIES"}
        </div>
      </div>
    </aside>
  );
}


export default FilterPanel;
