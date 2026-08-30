import {
  useEffect,
} from "react";

import "./LogModal.css";


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
    <div className="log-modal-field-row">
      <span className="log-modal-field-label">
        {label}
      </span>

      <span className="log-modal-field-value">
        {String(
          value,
        )}
      </span>
    </div>
  );
}


/*
 * View-only aside from delete — a log entry is
 * an agent's own permanent history, not
 * something a restart can act on (it has no
 * corresponding active ticket by the time it's
 * only visible here, either because the ticket
 * was reviewed/ignored/restarted already, or —
 * for a "request" log the Analyst flagged
 * without a ticket ever needing to exist — there
 * never was one).
 *
 * Uses its own log-modal-* class names rather
 * than sharing TicketModal's maintenance-modal-*
 * ones — both components' CSS loads onto the
 * page whenever Maintenance.jsx is mounted, even
 * though only one modal renders at a time, so
 * sharing class names would let whichever
 * stylesheet happens to load last silently win
 * for both.
 */
function LogModal({
  log,
  actionPending,
  onClose,
  onDelete,
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
      className="log-modal-backdrop"
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
        className="log-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Maintenance log entry"
      >
        <header className="log-modal-header">
          <div className="log-modal-heading">
            <span
              className={`log-modal-badge ${log.type}`}
            >
              {log.type}
            </span>

            <h1>
              {log.message}
            </h1>
          </div>


          <button
            type="button"
            className="log-modal-close"
            aria-label="Close log entry"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <div className="log-modal-document">
          <div className="log-modal-fields">
            <FieldRow
              label="AGENT"
              value={
                log.agentName
              }
            />

            <FieldRow
              label="STAGE"
              value={
                log.stage
              }
            />

            <FieldRow
              label="CREATED"
              value={
                formatTimestamp(
                  log.createdAt,
                )
              }
            />

            <FieldRow
              label="RUN ID"
              value={
                log.state
                  ?.runId
              }
            />
          </div>


          <div className="log-modal-section">
            <div className="log-modal-section-title">
              TASK
            </div>

            <p>
              {log.task}
            </p>
          </div>


          <div className="log-modal-section">
            <div className="log-modal-section-title">
              DETAILS
            </div>

            <p>
              {log.details}
            </p>
          </div>


          {log.state && (
            <div className="log-modal-section">
              <div className="log-modal-section-title">
                RESUMABLE STATE (AT THE TIME)
              </div>

              <pre className="log-modal-state">
                {JSON.stringify(
                  log.state,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>


        <footer className="log-modal-footer">
          <button
            type="button"
            className="log-modal-action"
            disabled={
              actionPending
            }
            onClick={
              onDelete
            }
          >
            DELETE LOG ENTRY
          </button>
        </footer>
      </section>
    </div>
  );
}


export default LogModal;
