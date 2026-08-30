import {
  useEffect,
  useMemo,
} from "react";

import "./AnalyticsLogModal.css";


function formatLabel(
  key,
) {
  const withoutLeadingUnderscore =
    key.replace(
      /^_/,
      "",
    );

  const spaced =
    withoutLeadingUnderscore.replace(
      /([A-Z])/g,
      " $1",
    );


  return spaced
    .trim()
    .toUpperCase();
}


function formatScalarValue(
  key,
  value,
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return "—";
  }


  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "YES"
      : "NO";
  }


  if (
    key
      .toLowerCase()
      .endsWith(
        "at",
      ) &&
    typeof value ===
      "string"
  ) {
    const date =
      new Date(
        value,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date.toLocaleString();
    }
  }


  return String(
    value,
  );
}


function isPlainObjectOrArray(
  value,
) {
  return (
    value !==
      null &&
    typeof value ===
      "object"
  );
}


/*
 * analytics.router and analytics.worker
 * documents genuinely differ in shape (a full
 * per-stage trace vs. one execution record), and
 * a future agent's own analytics collection will
 * have its own shape too — so rather than
 * hardcoding field names, every scalar field is
 * shown as a labeled row and every object/array
 * field (trace, controlPanelSettings,
 * finalRequestFields, usage, ...) gets its own
 * labeled JSON block. Whatever is actually on the
 * document is what gets shown.
 *
 * Uses its own analytics-log-modal-* class names
 * rather than the Maintenance page's LogModal
 * ones, even though the two are visually similar
 * — Vite bundles all component CSS globally, so
 * two different pages' components sharing a bare
 * class name like .log-modal-header would still
 * collide even though only one page is ever
 * mounted at a time.
 */
function AnalyticsLogModal({
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


  const {
    scalarEntries,
    objectEntries,
  } =
    useMemo(
      () => {
        const entries =
          Object.entries(
            log,
          );


        return {
          scalarEntries:
            entries.filter(
              (
                [
                  ,
                  value,
                ],
              ) =>
                !isPlainObjectOrArray(
                  value,
                ),
            ),

          objectEntries:
            entries.filter(
              (
                [
                  ,
                  value,
                ],
              ) =>
                isPlainObjectOrArray(
                  value,
                ),
            ),
        };
      },
      [
        log,
      ],
    );


  return (
    <div
      className="analytics-log-modal-backdrop"
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
        className="analytics-log-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Analytics log entry"
      >
        <header className="analytics-log-modal-header">
          <div className="analytics-log-modal-heading">
            <span className="analytics-log-modal-badge">
              {log.agentName}
            </span>

            <h1>
              {log.task ||
                "Analytics log"}
            </h1>
          </div>


          <button
            type="button"
            className="analytics-log-modal-close"
            aria-label="Close log entry"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <div className="analytics-log-modal-document">
          <div className="analytics-log-modal-fields">
            {scalarEntries.map(
              (
                [
                  key,
                  value,
                ],
              ) => (
                <div
                  key={
                    key
                  }
                  className="analytics-log-modal-field-row"
                >
                  <span className="analytics-log-modal-field-label">
                    {formatLabel(
                      key,
                    )}
                  </span>

                  <span className="analytics-log-modal-field-value">
                    {formatScalarValue(
                      key,
                      value,
                    )}
                  </span>
                </div>
              ),
            )}
          </div>


          {objectEntries.map(
            (
              [
                key,
                value,
              ],
            ) => (
              <div
                key={
                  key
                }
                className="analytics-log-modal-section"
              >
                <div className="analytics-log-modal-section-title">
                  {formatLabel(
                    key,
                  )}
                </div>

                <pre className="analytics-log-modal-state">
                  {JSON.stringify(
                    value,
                    null,
                    2,
                  )}
                </pre>
              </div>
            ),
          )}
        </div>


        <footer className="analytics-log-modal-footer">
          <button
            type="button"
            className="analytics-log-modal-action"
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


export default AnalyticsLogModal;
