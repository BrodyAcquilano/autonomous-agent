import "./StatusIndicator.css";


const STATUS_LABELS = {
  ready:
    "SYSTEM READY",

  busy:
    "SYSTEM BUSY",

  error:
    "SYSTEM ERROR",
};


/*
 * A fixed, non-draggable read-out of the same
 * shared systemStatus the Console's LightPanel
 * and the Maintenance page's own StatusIndicator
 * show. Deleting a log here sets systemStatus to
 * "busy" for the (fast, isolated) duration of the
 * request, and this page has no other controls
 * that need to lock on it — the point of showing
 * it here isn't to gate anything on this page, it
 * is so a busy/error state this page itself
 * caused is visible without needing to switch to
 * Console to see why.
 */
function StatusIndicator({
  systemStatus =
    "ready",
}) {
  const normalizedStatus =
    Object.prototype
      .hasOwnProperty.call(
        STATUS_LABELS,
        systemStatus,
      )
      ? systemStatus
      : "ready";


  return (
    <div
      className={`analytics-status-indicator analytics-status-indicator-${normalizedStatus}`}
    >
      <span className="analytics-status-indicator-light" />

      <span className="analytics-status-indicator-label">
        {
          STATUS_LABELS[
            normalizedStatus
          ]
        }
      </span>
    </div>
  );
}


export default StatusIndicator;
