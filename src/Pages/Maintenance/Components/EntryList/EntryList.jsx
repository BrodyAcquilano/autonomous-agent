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
 * One list, two modes. Tickets and logs share
 * most of the same shape (type, message, stage,
 * task, createdAt), but a ticket's meaningful
 * "who" is `loggedBy` (whichever agent's
 * incident it was escalated from), since its
 * `agentName` is always "maintenance" — the
 * submitter, not the reporter. A log entry has
 * no `loggedBy` of its own; its `agentName` is
 * exactly the agent whose collection it lives
 * in, so that's what a log row shows instead.
 * Only tickets carry a `status` a human can
 * change, so only tickets render a status chip.
 */
function EntryList({
  mode,
  loading,
  error,
  items,
  onSelect,
  disabled =
    false,
}) {
  if (
    loading
  ) {
    return (
      <section
        className="maintenance-entry-list"
        aria-label="Maintenance entries"
      >
        <div className="maintenance-entry-list-message">
          Loading
          {" "}
          {mode}
          ...
        </div>
      </section>
    );
  }


  if (
    error
  ) {
    return (
      <section
        className="maintenance-entry-list"
        aria-label="Maintenance entries"
      >
        <div className="maintenance-entry-list-error">
          <strong>
            {mode.toUpperCase()}
            {" "}
            ERROR
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
      className="maintenance-entry-list"
      aria-label="Maintenance entries"
    >
      {items.length ===
        0 && (
        <div className="maintenance-entry-list-empty">
          {mode ===
          "tickets"
            ? "No tickets match these filters."
            : "No log entries match these filters."}
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
            className={`maintenance-entry-row ${item.type}`}
            disabled={
              disabled
            }
            onClick={() => {
              onSelect(
                item,
              );
            }}
          >
            <span className="maintenance-entry-type">
              {item.type}
            </span>

            <span className="maintenance-entry-agent">
              {mode ===
              "tickets"
                ? item.loggedBy
                : item.agentName}
            </span>

            <span className="maintenance-entry-message">
              {item.message}
            </span>

            <span className="maintenance-entry-stage">
              STAGE
              {" "}
              {item.stage ??
                "—"}
            </span>

            {mode ===
              "tickets" && (
              <span
                className={`maintenance-entry-status ${item.status}`}
              >
                {item.status}
              </span>
            )}

            <span className="maintenance-entry-time">
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
