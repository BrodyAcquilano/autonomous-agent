import {
  useEffect,
  useMemo,
} from "react";

import ReactMarkdown from "react-markdown";

import "./ModelInfoModal.css";


/*
 * The modal shows exactly one document at
 * a time (model / api / tool / capability)
 * and navigates as a branching tree via a
 * small stack.
 *
 * The stack lives in Runtime (passed down
 * as stack/setStack), not local state, so
 * it survives navigating away from the
 * Models page and back. Resetting it when
 * a NEW model is picked is the caller's
 * responsibility (Models.jsx), not this
 * component's — a mount-based reset here
 * would wipe the persisted stack every
 * time the modal reopens on the same model.
 */
function ModelInfoModal({
  model,
  modelIndex,
  modelCount,
  apis,
  toolsCatalog,
  capabilitiesCatalog,
  stack,
  setStack,
  onClose,
  onPrevious,
  onNext,
}) {
  const view =
    stack.length
      ? stack[
          stack.length -
          1
        ]
      : {
          type:
            "model",
        };


  function pushView(
    nextView,
  ) {
    setStack(
      (
        current,
      ) => [
        ...current,
        nextView,
      ],
    );
  }


  function goBack() {
    setStack(
      (
        current,
      ) =>
        current.slice(
          0,
          -1,
        ),
    );
  }


  useEffect(
    () => {
      const handleKeyDown = (
        event,
      ) => {
        switch (
          event.key
        ) {
          case "Escape":
            onClose();

            break;


          case "ArrowLeft":
            if (
              stack.length ===
              0
            ) {
              onPrevious();
            }

            break;


          case "ArrowRight":
            if (
              stack.length ===
              0
            ) {
              onNext();
            }

            break;


          case "Backspace":
            if (
              stack.length >
              0
            ) {
              goBack();
            }

            break;


          default:
            break;
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
      onPrevious,
      onNext,
      stack.length,
    ],
  );


  const relatedApis =
    useMemo(
      () =>
        apis.filter(
          (
            api,
          ) =>
            api.model ===
            model._id,
        ),
      [
        apis,
        model._id,
      ],
    );


  let eyebrow =
    "MODEL DOCUMENTATION";

  let title =
    model.displayName;

  let markdown =
    model.contentMarkdown;

  let missingLabel =
    model.name;

  let relatedTools =
    [];

  let relatedCapabilities =
    [];

  let capabilityTemplate =
    null;


  if (
    view.type ===
    "api"
  ) {
    const api =
      apis.find(
        (
          item,
        ) =>
          item._id ===
          view.id,
      ) ||
      null;


    eyebrow =
      "API DOCUMENTATION";

    title =
      api?.displayName ||
      "API";

    markdown =
      api?.contentMarkdown ||
      null;

    missingLabel =
      api?.name ||
      view.id;


    relatedTools =
      toolsCatalog.filter(
        (
          tool,
        ) =>
          api &&
          tool.api ===
            api._id,
      );
  } else if (
    view.type ===
    "tool"
  ) {
    const tool =
      toolsCatalog.find(
        (
          item,
        ) =>
          item._id ===
          view.id,
      ) ||
      null;


    eyebrow =
      "TOOL DOCUMENTATION";

    title =
      tool?.displayName ||
      "Tool";

    markdown =
      tool?.contentMarkdown ||
      null;

    missingLabel =
      tool?.name ||
      view.id;


    relatedCapabilities =
      capabilitiesCatalog.filter(
        (
          capability,
        ) =>
          tool &&
          capability.tool ===
            tool._id,
      );
  } else if (
    view.type ===
    "capability"
  ) {
    const capability =
      capabilitiesCatalog.find(
        (
          item,
        ) =>
          item._id ===
          view.id,
      ) ||
      null;


    eyebrow =
      "CAPABILITY DOCUMENTATION";

    title =
      capability?.displayName ||
      "Capability";

    markdown =
      capability?.contentMarkdown ||
      null;

    missingLabel =
      capability?.name ||
      view.id;

    capabilityTemplate =
      capability?.requestTemplate ||
      null;
  }


  return (
    <div
      className="model-modal-backdrop"
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
        className="model-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} documentation`}
      >
        <header className="model-modal-header">
          <div className="model-modal-header-side model-modal-header-left">
            {view.type ===
            "model" ? (
              <span className="model-modal-position">
                {modelIndex + 1}
                {" / "}
                {modelCount}
              </span>
            ) : (
              <button
                type="button"
                className="model-modal-back"
                onClick={
                  goBack
                }
              >
                ‹ BACK
              </button>
            )}
          </div>


          <div className="model-modal-heading">
            <span className="model-modal-eyebrow">
              {eyebrow}
            </span>

            <h1>
              {title}
            </h1>
          </div>


          <div className="model-modal-header-side model-modal-header-right">
            <button
              type="button"
              className="model-modal-close"
              aria-label="Close model information"
              onClick={
                onClose
              }
            >
              ×
            </button>
          </div>
        </header>


        {view.type ===
          "model" && (
          <button
            type="button"
            className="model-modal-arrow model-modal-arrow-left"
            aria-label="Previous model"
            onClick={
              onPrevious
            }
          >
            ‹
          </button>
        )}


        <div className="model-modal-document">
          {markdown ? (
            <div className="model-markdown">
              <ReactMarkdown>
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="model-markdown-missing">
              <h2>
                Documentation unavailable
              </h2>

              <p>
                No content was
                found for{" "}
                <code>
                  {missingLabel}
                </code>.
              </p>
            </div>
          )}


          {capabilityTemplate && (
            <pre className="model-capability-template">
              {JSON.stringify(
                capabilityTemplate,
                null,
                2,
              )}
            </pre>
          )}


          {view.type ===
            "model" && (
            <section className="model-related-links">
              <div className="model-related-links-title">
                APIS FOR THIS MODEL
              </div>

              <div className="model-related-links-list">
                {relatedApis.length ===
                  0 && (
                  <span className="model-related-links-empty">
                    No APIs configured yet.
                  </span>
                )}

                {relatedApis.map(
                  (
                    api,
                  ) => (
                    <button
                      key={
                        api._id
                      }
                      type="button"
                      className="model-related-link"
                      onClick={() => {
                        pushView({
                          type:
                            "api",

                          id:
                            api._id,
                        });
                      }}
                    >
                      {api.displayName}
                    </button>
                  ),
                )}
              </div>
            </section>
          )}


          {view.type ===
            "api" && (
            <section className="model-related-links">
              <div className="model-related-links-title">
                TOOLS FOR THIS API
              </div>

              <div className="model-related-links-list">
                {relatedTools.length ===
                  0 && (
                  <span className="model-related-links-empty">
                    No tools configured yet — the default request shape above is a complete route on its own.
                  </span>
                )}

                {relatedTools.map(
                  (
                    tool,
                  ) => (
                    <button
                      key={
                        tool._id
                      }
                      type="button"
                      className="model-related-link"
                      onClick={() => {
                        pushView({
                          type:
                            "tool",

                          id:
                            tool._id,
                        });
                      }}
                    >
                      {tool.displayName}
                    </button>
                  ),
                )}
              </div>
            </section>
          )}


          {view.type ===
            "tool" && (
            <section className="model-related-links">
              <div className="model-related-links-title">
                CAPABILITIES FOR THIS TOOL
              </div>

              <div className="model-related-links-list">
                {relatedCapabilities.length ===
                  0 && (
                  <span className="model-related-links-empty">
                    No capability recipes configured yet.
                  </span>
                )}

                {relatedCapabilities.map(
                  (
                    capability,
                  ) => (
                    <button
                      key={
                        capability._id
                      }
                      type="button"
                      className="model-related-link"
                      onClick={() => {
                        pushView({
                          type:
                            "capability",

                          id:
                            capability._id,
                        });
                      }}
                    >
                      {capability.displayName}
                    </button>
                  ),
                )}
              </div>
            </section>
          )}
        </div>


        {view.type ===
          "model" && (
          <button
            type="button"
            className="model-modal-arrow model-modal-arrow-right"
            aria-label="Next model"
            onClick={
              onNext
            }
          >
            ›
          </button>
        )}
      </section>
    </div>
  );
}


export default ModelInfoModal;
