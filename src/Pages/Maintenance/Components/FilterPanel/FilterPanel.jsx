import "./FilterPanel.css";


const TYPE_OPTIONS = [
  {
    value:
      "all",

    label:
      "ALL TYPES",
  },
  {
    value:
      "error",

    label:
      "ERROR",
  },
  {
    value:
      "request",

    label:
      "REQUEST",
  },
];


const STATUS_OPTIONS = [
  {
    value:
      "all",

    label:
      "ALL STATUSES",
  },
  {
    value:
      "new",

    label:
      "NEW",
  },
  {
    value:
      "reviewed",

    label:
      "REVIEWED",
  },
];


function FilterPanel({
  viewMode,
  setViewMode,

  typeFilter,
  setTypeFilter,

  statusFilter,
  setStatusFilter,

  agents,
  loggedByFilter,
  setLoggedByFilter,
  logsAgentFilter,
  setLogsAgentFilter,

  ticketCount,
  logCount,

  maintenanceFocusText,
  setMaintenanceFocusText,
  maintenanceRequestPending,
  onSubmitMaintenanceRequest,
  systemStatus,
}) {
  return (
    <aside
      className="maintenance-filter-panel"
      aria-label="Maintenance filters"
    >
      <div className="maintenance-view-toggle">
        <button
          type="button"
          className={
            viewMode ===
            "tickets"
              ? "active"
              : ""
          }
          onClick={() => {
            setViewMode(
              "tickets",
            );
          }}
        >
          TICKETS
        </button>

        <button
          type="button"
          className={
            viewMode ===
            "logs"
              ? "active"
              : ""
          }
          onClick={() => {
            setViewMode(
              "logs",
            );
          }}
        >
          LOGS
        </button>
      </div>


      {viewMode ===
        "tickets" && (
        <div className="maintenance-filter-section">
          <div className="maintenance-filter-title">
            TYPE
          </div>

          <div className="maintenance-filter-options">
            {TYPE_OPTIONS.map(
              (
                option,
              ) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  className={
                    typeFilter ===
                    option.value
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setTypeFilter(
                      option.value,
                    );
                  }}
                >
                  {option.label}
                </button>
              ),
            )}
          </div>


          <div className="maintenance-filter-title">
            STATUS
          </div>

          <div className="maintenance-filter-options">
            {STATUS_OPTIONS.map(
              (
                option,
              ) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  className={
                    statusFilter ===
                    option.value
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setStatusFilter(
                      option.value,
                    );
                  }}
                >
                  {option.label}
                </button>
              ),
            )}
          </div>


          <div className="maintenance-filter-title">
            LOGGED BY
          </div>

          <div className="maintenance-filter-options maintenance-filter-options-vertical">
            <button
              type="button"
              className={
                loggedByFilter ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setLoggedByFilter(
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
                    loggedByFilter ===
                    agent.name
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setLoggedByFilter(
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


          <div className="maintenance-filter-count">
            {ticketCount}
            {" "}
            {ticketCount ===
            1
              ? "TICKET"
              : "TICKETS"}
          </div>
        </div>
      )}


      {viewMode ===
        "logs" && (
        <div className="maintenance-filter-section">
          <div className="maintenance-filter-title">
            AGENT
          </div>

          <div className="maintenance-filter-options maintenance-filter-options-vertical">
            <button
              type="button"
              className={
                logsAgentFilter ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setLogsAgentFilter(
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
                    logsAgentFilter ===
                    agent.name
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setLogsAgentFilter(
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


          <div className="maintenance-filter-count">
            {logCount}
            {" "}
            {logCount ===
            1
              ? "LOG ENTRY"
              : "LOG ENTRIES"}
          </div>
        </div>
      )}


      <div className="maintenance-request-panel">
        <div className="maintenance-filter-title">
          REQUEST MAINTENANCE
        </div>

        <p className="maintenance-request-hint">
          Describe something for the Maintenance
          agent to look into, or leave this blank
          to have it sweep whatever incidents are
          currently queued.
        </p>

        <textarea
          className="maintenance-request-textarea"
          placeholder="e.g. is gpt-5.6-terra still the latest version?"
          value={
            maintenanceFocusText
          }
          disabled={
            maintenanceRequestPending ||
            systemStatus ===
              "busy"
          }
          onChange={(
            event,
          ) => {
            setMaintenanceFocusText(
              event.target
                .value,
            );
          }}
        />

        <button
          type="button"
          className="maintenance-request-submit"
          disabled={
            maintenanceRequestPending ||
            systemStatus ===
              "busy"
          }
          onClick={
            onSubmitMaintenanceRequest
          }
        >
          {systemStatus ===
          "busy"
            ? "SYSTEM BUSY"
            : maintenanceRequestPending
              ? "INVESTIGATING..."
              : "SUBMIT REQUEST"}
        </button>
      </div>
    </aside>
  );
}


export default FilterPanel;
