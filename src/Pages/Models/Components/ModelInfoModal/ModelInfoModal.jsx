import {
  useEffect,
} from "react";

import ReactMarkdown from "react-markdown";

import "./ModelInfoModal.css";


function ModelInfoModal({
  model,
  modelIndex,
  modelCount,
  onClose,
  onPrevious,
  onNext,
}) {
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
            onPrevious();

            break;


          case "ArrowRight":
            onNext();

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
    ],
  );


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
        aria-label={`${model.name} model information`}
      >
        <header className="model-modal-header">
          <div className="model-modal-heading">
            <span className="model-modal-eyebrow">
              MODEL DOCUMENTATION
            </span>

            <h1>
              {model.name}
            </h1>

            <span className="model-modal-position">
              {modelIndex + 1}
              {" / "}
              {modelCount}
            </span>
          </div>

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
        </header>


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


        <div className="model-modal-document">
          {model.markdown ? (
            <div className="model-markdown">
              <ReactMarkdown>
                {model.markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="model-markdown-missing">
              <h2>
                Model file unavailable
              </h2>

              <p>
                No Markdown file was
                returned for{" "}
                <code>
                  {model.modelId}
                </code>.
              </p>
            </div>
          )}
        </div>


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
      </section>
    </div>
  );
}


export default ModelInfoModal;