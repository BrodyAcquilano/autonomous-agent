import {
  useEffect,
} from "react";

import "./TicketModal.css";


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


function FieldRow({
  label,
  value,
}) {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return null;
  }


  return (
    <div className="maintenance-modal-field-row">
      <span className="maintenance-modal-field-label">
        {label}
      </span>

      <span className="maintenance-modal-field-value">
        {String(
          value,
        )}
      </span>
    </div>
  );
}


/*
 * Three actions, matching the three ways an
 * active ticket ever leaves the queue: marking
 * it reviewed keeps it in the queue (a human
 * looked but hasn't decided yet), ignoring or
 * restarting both remove it — ignoring is a
 * direct human decision that no action is
 * needed, restarting calls the normal
 * request-service route with this ticket's id
 * so the run resumes from wherever it left off.
 */
function TicketModal({
  ticket,
  actionPending,
  systemStatus,
  onClose,
  onMarkReviewed,
  onIgnore,
  onRestart,
}) {
  useEffect(
    () => {
      const handleKeyDown = (
        event,
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };


      window.addEventListener(
        "keydown",
        handleKeyDown,
      );


      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      onClose,
    ],
  );


  return (
    <div
      className="maintenance-modal-backdrop"
      role="presentation"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="maintenance-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Maintenance ticket"
      >
        <header className="maintenance-modal-header">
          <div className="maintenance-modal-heading">
            <span
              className={`maintenance-modal-badge ${ticket.type}`}
            >
              {ticket.type}
            </span>

            <span
              className={`maintenance-modal-badge ${ticket.status}`}
            >
              {ticket.status}
            </span>

            <h1>
              {ticket.message}
            </h1>
          </div>


          <button
            type="button"
            className="maintenance-modal-close"
            aria-label="Close ticket"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <div className="maintenance-modal-document">
          <div className="maintenance-modal-fields">
            <FieldRow
              label="AGENT"
              value={
                ticket.agentName
              }
            />

            <FieldRow
              label="STAGE"
              value={
                ticket.stage
              }
            />

            <FieldRow
              label="CREATED"
              value={
                formatTimestamp(
                  ticket.createdAt,
                )
              }
            />

            <FieldRow
              label="RUN ID"
              value={
                ticket.state
                  ?.runId
              }
            />

            <FieldRow
              label="RESTART COUNT"
              value={
                ticket.state
                  ?.restartCount ??
                0
              }
            />
          </div>


          <div className="maintenance-modal-section">
            <div className="maintenance-modal-section-title">
              TASK
            </div>

            <p>
              {ticket.task}
            </p>
          </div>


          <div className="maintenance-modal-section">
            <div className="maintenance-modal-section-title">
              DETAILS
            </div>

            <p>
              {ticket.details}
            </p>
          </div>


          {ticket.state && (
            <div className="maintenance-modal-section">
              <div className="maintenance-modal-section-title">
                RESUMABLE STATE
              </div>

              <pre className="maintenance-modal-state">
                {JSON.stringify(
                  ticket.state,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>


        <footer className="maintenance-modal-footer">
          <button
            type="button"
            className="maintenance-modal-action reviewed"
            disabled={
              actionPending ||
              ticket.status ===
                "reviewed"
            }
            onClick={
              onMarkReviewed
            }
          >
            MARK REVIEWED
          </button>

          <button
            type="button"
            className="maintenance-modal-action ignore"
            disabled={
              actionPending
            }
            onClick={
              onIgnore
            }
          >
            IGNORE
          </button>

          <button
            type="button"
            className="maintenance-modal-action restart"
            disabled={
              actionPending ||
              systemStatus ===
                "busy"
            }
            title={
              systemStatus ===
              "busy"
                ? "The system is busy with another run — try again once it finishes."
                : undefined
            }
            onClick={
              onRestart
            }
          >
            {systemStatus ===
            "busy"
              ? "SYSTEM BUSY"
              : "RESTART PROCESS"}
          </button>
        </footer>
      </section>
    </div>
  );
}


export default TicketModal;
