import "./EntryList.css";


function formatTimestamp(
  value,
) {
  if (
    !value
  ) {
    return "—";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }


  return date.toLocaleString();
}


/*
 * analytics.router (a full per-stage run trace)
 * and analytics.worker (one execution record)
 * have no shared "type" field the way maintenance
 * tickets/logs do, but both always carry `task`,
 * `status`, and `createdAt` — enough for a useful
 * row without assuming anything else about the
 * document's shape. `status` drives the color
 * coding since its own vocabulary already reads
 * as success/failure/in-between across both
 * collections (completed / failed / blocked /
 * in_progress / resumed / stopped_by_analytics).
 */
function getStatusTone(
  status,
) {
  if (
    status ===
    "completed"
  ) {
    return "success";
  }


  if (
    status ===
      "failed" ||
    status ===
      "blocked"
  ) {
    return "danger";
  }


  return "neutral";
}


function EntryList({
  loading,
  error,
  items,
  onSelect,
}) {
  if (
    loading
  ) {
    return (
      <section
        className="analytics-entry-list"
        aria-label="Analytics entries"
      >
        <div className="analytics-entry-list-message">
          Loading logs...
        </div>
      </section>
    );
  }


  if (
    error
  ) {
    return (
      <section
        className="analytics-entry-list"
        aria-label="Analytics entries"
      >
        <div className="analytics-entry-list-error">
          <strong>
            ANALYTICS ERROR
          </strong>

          <span>
            {error}
          </span>
        </div>
      </section>
    );
  }


  return (
    <section
      className="analytics-entry-list"
      aria-label="Analytics entries"
    >
      {items.length ===
        0 && (
        <div className="analytics-entry-list-empty">
          No log entries match these filters.
        </div>
      )}


      {items.map(
        (
          item,
        ) => (
          <button
            key={
              item._id
            }
            type="button"
            className={`analytics-entry-row ${getStatusTone(
              item.status,
            )}`}
            onClick={() => {
              onSelect(
                item,
              );
            }}
          >
            <span className="analytics-entry-agent">
              {item.agentName}
            </span>

            <span className="analytics-entry-task">
              {item.task ||
                "(no task recorded)"}
            </span>

            <span
              className={`analytics-entry-status ${getStatusTone(
                item.status,
              )}`}
            >
              {item.status ||
                "—"}
            </span>

            <span className="analytics-entry-time">
              {formatTimestamp(
                item.createdAt,
              )}
            </span>
          </button>
        ),
      )}
    </section>
  );
}


export default EntryList;
