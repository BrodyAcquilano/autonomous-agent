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
 * the same underlying document shape (type,
 * message, stage, task, createdAt, agentName)
 * since a log entry IS a ticket's permanent
 * copy — the only real difference is that
 * tickets also carry a `status` a human can
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
              {item.agentName}
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
