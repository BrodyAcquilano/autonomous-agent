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
 * shows — deliberately a separate, much simpler
 * component (no drag/resize) rather than reusing
 * LightPanel itself, since this just sits in a
 * fixed spot in the page header rather than
 * floating on a pannable viewport.
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
      className={`maintenance-status-indicator maintenance-status-indicator-${normalizedStatus}`}
    >
      <span className="maintenance-status-indicator-light" />

      <span className="maintenance-status-indicator-label">
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
