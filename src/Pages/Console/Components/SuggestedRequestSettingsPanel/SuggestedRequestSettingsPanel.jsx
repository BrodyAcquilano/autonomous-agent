import useDraggable from "../../../../Hooks/useDraggable";
import useResizable, {
  RESIZE_DIRECTIONS,
} from "../../../../Hooks/useResizable";

import "./SuggestedRequestSettingsPanel.css";


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


/* --------------------------------
   HEIGHT-DRIVEN CONTENT SCALE
-------------------------------- */

/*
 * The panel's current default placement
 * uses -343px on Y from a 50% anchor.
 *
 * 343 * 2 = 686, so 686px is the natural
 * baseline height for the current design.
 */
const BASE_PANEL_HEIGHT =
  686;


const BASE_BODY_FONT_SIZE =
  12;


const BASE_HEADER_FONT_SIZE =
  14;


const BASE_FIELD_HEIGHT =
  40;


const BASE_HEADER_HEIGHT =
  39;


const BASE_CHECKBOX_WIDTH =
  17;


const BASE_CHECKBOX_HEIGHT =
  15;


/*
 * 12px body / 14px header are the minimum.
 *
 * Shrinking the panel therefore creates
 * more internal scrolling instead of making
 * text unreadably small.
 */
const MIN_CONTENT_SCALE =
  1;


/*
 * Current max panel height is 1400px:
 *
 * 1400 / 686 ~= 2.04
 *
 * The cap is kept just above that so the
 * resize limit, rather than an arbitrary
 * font ceiling, determines the practical
 * maximum scale.
 */
const MAX_CONTENT_SCALE =
  2.05;


function clamp(
  value,
  minimum,
  maximum,
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}


function getContentScale(
  height,
) {
  const normalizedHeight =
    Number.isFinite(
      height,
    )
      ? height
      : BASE_PANEL_HEIGHT;


  return clamp(
    normalizedHeight /
      BASE_PANEL_HEIGHT,

    MIN_CONTENT_SCALE,

    MAX_CONTENT_SCALE,
  );
}


function SuggestedRequestSettingsPanel({
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
        ".request-control-panel-content, .request-control-panel-footer, .resize-handle",
    });


  const {
    resizeStyle,
    getResizeHandleProps,

    size:
      resizedSize,
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
        1400,

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


  /*
   * IMPORTANT:
   *
   * This scale comes ONLY from the panel's
   * persisted HEIGHT.
   *
   * Console viewport zoom is still passed to
   * useDraggable/useResizable for pointer math,
   * but viewport zoom does not alter these
   * internal font sizes.
   *
   * Width-only resizing also leaves this scale
   * unchanged.
   */
  const contentScale =
    getContentScale(
      resizedSize
        ?.height,
    );


  const bodyFontSize =
    BASE_BODY_FONT_SIZE *
    contentScale;


  const headerFontSize =
    BASE_HEADER_FONT_SIZE *
    contentScale;


  /*
   * Keep the surrounding padding visually
   * stable while allowing controls to become
   * taller enough for the larger text.
   */
  const fieldHeight =
    BASE_FIELD_HEIGHT +
    (
      contentScale -
      1
    ) *
    24;


  const headerHeight =
    BASE_HEADER_HEIGHT +
    (
      contentScale -
      1
    ) *
    18;


  const checkboxWidth =
    BASE_CHECKBOX_WIDTH *
    contentScale;


  const checkboxHeight =
    BASE_CHECKBOX_HEIGHT *
    contentScale;


  const checkboxColumnWidth =
    Math.max(
      18,
      checkboxWidth +
        1,
    );


  /*
   * Tool option grids line up with the text
   * column beside the checkbox.
   *
   * The 11px visual gap itself stays fixed.
   */
  const toolOptionsLeft =
    checkboxColumnWidth +
    11;


  const panelStyle = {
    ...dragStyle,

    ...resizeStyle,

    "--request-control-body-font-size":
      `${bodyFontSize}px`,

    "--request-control-header-font-size":
      `${headerFontSize}px`,

    "--request-control-field-height":
      `${fieldHeight}px`,

    "--request-control-header-height":
      `${headerHeight}px`,

    "--request-control-checkbox-width":
      `${checkboxWidth}px`,

    "--request-control-checkbox-height":
      `${checkboxHeight}px`,

    "--request-control-checkbox-column":
      `${checkboxColumnWidth}px`,

    "--request-control-tool-options-left":
      `${toolOptionsLeft}px`,
  };


  return (
    <section
      ref={
        dragRef
      }
      className="request-control-panel"
      style={
        panelStyle
      }
      {...dragHandleProps}
    >
      <header
        className="request-control-panel-header"
      >
        <span className="request-control-panel-title">
          SUGGESTED REQUEST SETTINGS*
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


      <footer className="request-control-panel-footer">
        * Suggestions only — the Router weighs these against the task and its own
        database and may choose differently.
      </footer>


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


export default SuggestedRequestSettingsPanel;