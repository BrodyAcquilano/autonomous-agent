import useDraggable from "../../../../Hooks/useDraggable";
import useResizable, {
  RESIZE_DIRECTIONS,
} from "../../../../Hooks/useResizable";

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

  scale = 1,

  offset,

  onOffsetChange,

  size,

  onSizeChange,
}) {
  const {
    dragRef,
    dragHandleProps,
    dragStyle,
  } =
    useDraggable({
      boundsRef,

      scale,

      offset,

      onOffsetChange,

      ignoreSelector:
        ".request-control-panel-content, .resize-handle",
    });


  const {
    resizeStyle,
    getResizeHandleProps,
  } =
    useResizable({
      targetRef:
        dragRef,

      scale,

      minWidth:
        360,

      minHeight:
        420,

      maxWidth:
        1200,

      maxHeight:
        1100,

      anchorMode:
        "top-left",

      size,

      onSizeChange,

      offset,

      onOffsetChange,
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


  function updateToolEnabled(
    toolKey,
    enabled,
  ) {
    setRequestSettings(
      (
        current,
      ) => ({
        ...current,

        tools: {
          ...current.tools,

          [toolKey]: {
            ...current
              .tools
              ?.[
                toolKey
              ],

            enabled,
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
        "auto",

      size:
        "auto",
    };


  const codeInterpreter =
    requestSettings
      .tools
      ?.code_interpreter ||
    {
      enabled:
        false,
    };


  const webSearch =
    requestSettings
      .tools
      ?.web_search ||
    {
      enabled:
        false,
    };


  return (
    <section
      ref={
        dragRef
      }
      className="request-control-panel"
      style={{
        ...dragStyle,
        ...resizeStyle,
      }}
      {...dragHandleProps}
    >
      <header
        className="request-control-panel-header"
      >
        <span className="request-control-panel-title">
          REQUEST CONTROL
        </span>


        <span className="request-control-panel-model">
          {model}
        </span>
      </header>


      <div
        className="request-control-panel-content"
        data-console-wheel-scroll="true"
      >
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


        <div className="request-control-tools-list">
          <div className="request-control-tool">
            <label className="request-control-tool-row">
              <input
                type="checkbox"
                checked={
                  imageGeneration.enabled
                }
                onChange={(
                  event,
                ) => {
                  updateToolEnabled(
                    "image_generation",
                    event.target.checked,
                  );
                }}
              />


              <span className="request-control-tool-copy">
                <span className="request-control-tool-name">
                  IMAGE GENERATION
                </span>


                <span className="request-control-tool-description">
                  OPTIONAL IMAGE OUTPUT USING GPT-IMAGE-2
                </span>
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


          <div className="request-control-tool">
            <label className="request-control-tool-row">
              <input
                type="checkbox"
                checked={
                  codeInterpreter.enabled
                }
                onChange={(
                  event,
                ) => {
                  updateToolEnabled(
                    "code_interpreter",
                    event.target.checked,
                  );
                }}
              />


              <span className="request-control-tool-copy">
                <span className="request-control-tool-name">
                  CODE INTERPRETER
                </span>


                <span className="request-control-tool-description">
                  FILE GENERATION + PYTHON CODE EXECUTION
                </span>


                <span className="request-control-tool-formats">
                  PDF · MD · TXT · CSV · XLSX · CODE · IMAGES · ZIP + MORE
                </span>
              </span>
            </label>
          </div>


          <div className="request-control-tool">
            <label className="request-control-tool-row">
              <input
                type="checkbox"
                checked={
                  webSearch.enabled
                }
                onChange={(
                  event,
                ) => {
                  updateToolEnabled(
                    "web_search",
                    event.target.checked,
                  );
                }}
              />


              <span className="request-control-tool-copy">
                <span className="request-control-tool-name">
                  WEB SEARCH
                </span>


                <span className="request-control-tool-description">
                  SEARCH CURRENT PUBLIC WEB INFORMATION
                </span>


                <span className="request-control-tool-formats">
                  CURRENT INFORMATION · SOURCES · CITATIONS
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
      </div>


      {RESIZE_DIRECTIONS.map(
        (
          direction,
        ) => (
          <div
            key={
              direction
            }
            className={`resize-handle resize-handle-${direction}`}
            {...getResizeHandleProps(
              direction,
            )}
          />
        ),
      )}
    </section>
  );
}


export default RequestControlPanel;