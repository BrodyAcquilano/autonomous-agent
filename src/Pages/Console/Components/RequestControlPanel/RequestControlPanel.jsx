import useDraggable from "../../../../Hooks/useDraggable";

import "./RequestControlPanel.css";


const REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];


const REASONING_MODES = [
  "standard",
  "pro",
];


const VERBOSITY_LEVELS = [
  "low",
  "medium",
  "high",
];


const IMAGE_QUALITIES = [
  "auto",
  "low",
  "medium",
  "high",
];


const IMAGE_SIZES = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
];


function RequestControlPanel({
  model,
  requestSettings,
  setRequestSettings,
  boundsRef,
}) {
  const {
    dragRef,
    dragHandleProps,
    dragStyle,
  } =
    useDraggable({
      boundsRef,
    });


  function updateReasoning(
    field,
    value,
  ) {
    setRequestSettings(
      (
        current,
      ) => ({
        ...current,

        reasoning: {
          ...current.reasoning,

          [field]:
            value,
        },
      }),
    );
  }


  function updateText(
    field,
    value,
  ) {
    setRequestSettings(
      (
        current,
      ) => ({
        ...current,

        text: {
          ...current.text,

          [field]:
            value,
        },
      }),
    );
  }


  function updateImageGeneration(
    field,
    value,
  ) {
    setRequestSettings(
      (
        current,
      ) => ({
        ...current,

        tools: {
          ...current.tools,

          image_generation: {
            ...current
              .tools
              ?.image_generation,

            [field]:
              value,
          },
        },
      }),
    );
  }


  function updateMaxOutputTokens(
    value,
  ) {
    if (
      value ===
      ""
    ) {
      setRequestSettings(
        (
          current,
        ) => ({
          ...current,

          max_output_tokens:
            null,
        }),
      );

      return;
    }


    const parsedValue =
      Number(
        value,
      );


    if (
      !Number.isFinite(
        parsedValue,
      )
    ) {
      return;
    }


    setRequestSettings(
      (
        current,
      ) => ({
        ...current,

        max_output_tokens:
          Math.min(
            128000,
            Math.max(
              1,
              Math.trunc(
                parsedValue,
              ),
            ),
          ),
      }),
    );
  }


  const imageGeneration =
    requestSettings
      .tools
      ?.image_generation ||
    {
      enabled:
        false,

      quality:
        "high",

      size:
        "1024x1024",
    };


  return (
    <section
      ref={
        dragRef
      }
      className="request-control-panel"
      style={
        dragStyle
      }
    >
      <header
        className="request-control-panel-header"
        {...dragHandleProps}
      >
        <span className="request-control-panel-title">
          REQUEST CONTROL
        </span>

        <span className="request-control-panel-model">
          {model}
        </span>
      </header>


      <div className="request-control-panel-section">
        <div className="request-control-panel-section-title">
          MODEL PARAMETERS
        </div>


        <div className="request-control-panel-grid">
          <label className="request-control-field">
            <span className="request-control-label">
              REASONING EFFORT
            </span>

            <select
              value={
                requestSettings
                  .reasoning
                  .effort
              }
              onChange={(
                event,
              ) => {
                updateReasoning(
                  "effort",
                  event.target.value,
                );
              }}
            >
              {REASONING_EFFORTS.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="request-control-field">
            <span className="request-control-label">
              REASONING MODE
            </span>

            <select
              value={
                requestSettings
                  .reasoning
                  .mode
              }
              onChange={(
                event,
              ) => {
                updateReasoning(
                  "mode",
                  event.target.value,
                );
              }}
            >
              {REASONING_MODES.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="request-control-field">
            <span className="request-control-label">
              VERBOSITY
            </span>

            <select
              value={
                requestSettings
                  .text
                  .verbosity
              }
              onChange={(
                event,
              ) => {
                updateText(
                  "verbosity",
                  event.target.value,
                );
              }}
            >
              {VERBOSITY_LEVELS.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="request-control-field">
            <span className="request-control-label">
              MAX OUTPUT TOKENS
            </span>

            <input
              type="number"
              min="1"
              max="128000"
              step="1000"
              value={
                requestSettings
                  .max_output_tokens ??
                ""
              }
              onChange={(
                event,
              ) => {
                updateMaxOutputTokens(
                  event.target.value,
                );
              }}
            />
          </label>
        </div>
      </div>


      <div className="request-control-panel-section request-control-tools-section">
        <div className="request-control-panel-section-title">
          TOOLS
        </div>


        <label className="request-control-tool-toggle">
          <input
            type="checkbox"
            checked={
              imageGeneration.enabled
            }
            onChange={(
              event,
            ) => {
              updateImageGeneration(
                "enabled",
                event.target.checked,
              );
            }}
          />

          <span>
            IMAGE GENERATION
          </span>
        </label>


        <div
          className={`request-control-panel-grid request-control-tool-options ${
            imageGeneration.enabled
              ? ""
              : "disabled"
          }`}
        >
          <label className="request-control-field">
            <span className="request-control-label">
              QUALITY
            </span>

            <select
              disabled={
                !imageGeneration.enabled
              }
              value={
                imageGeneration.quality
              }
              onChange={(
                event,
              ) => {
                updateImageGeneration(
                  "quality",
                  event.target.value,
                );
              }}
            >
              {IMAGE_QUALITIES.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="request-control-field">
            <span className="request-control-label">
              SIZE
            </span>

            <select
              disabled={
                !imageGeneration.enabled
              }
              value={
                imageGeneration.size
              }
              onChange={(
                event,
              ) => {
                updateImageGeneration(
                  "size",
                  event.target.value,
                );
              }}
            >
              {IMAGE_SIZES.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}


export default RequestControlPanel;