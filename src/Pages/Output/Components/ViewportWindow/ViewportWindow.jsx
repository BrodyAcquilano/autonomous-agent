import {
  useMemo,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import useDraggable from "../../../../Hooks/useDraggable";
import useResizable, {
  RESIZE_DIRECTIONS,
} from "../../../../Hooks/useResizable";

import "./ViewportWindow.css";


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


/* --------------------------------
   HEIGHT-DRIVEN CONTENT SCALE
-------------------------------- */

/*
 * Existing typography is the minimum, same
 * convention as Console's MessagePanel/
 * LightPanel: shrinking a window never makes
 * its renderer's text smaller than default.
 */
const MIN_CONTENT_SCALE =
  1;


/*
 * ViewportWindow allows a maximum height of
 * 1200px. The smallest default window height
 * (360x460 "default" variant) would reach
 * 1200 / 460 ~= 2.6, so 2.5 gives generous
 * headroom without an oddly precise number.
 */
const MAX_CONTENT_SCALE =
  2.5;


/*
 * Scale is driven by how tall THIS window
 * currently is relative to its own variant's
 * default height (not a single shared
 * baseline) — a "document" window and a
 * "default" window both start at scale 1,
 * regardless of their different default sizes.
 *
 * Exposed as a unitless CSS custom property
 * so it inherits down to whichever renderer
 * is mounted as children — each renderer's
 * own CSS decides which base font sizes to
 * multiply it against (PDF/Image renderers
 * fill their space naturally and can ignore
 * it entirely).
 */
function getContentScale(
  height,
  baseHeight,
) {
  const normalizedHeight =
    Number.isFinite(
      height,
    )
      ? height
      : baseHeight;


  return clamp(
    normalizedHeight /
      baseHeight,

    MIN_CONTENT_SCALE,

    MAX_CONTENT_SCALE,
  );
}


function getWindowDimensions(
  variant,
  aspectRatio,
) {
  switch (
    variant
  ) {
    case "image": {
      const width =
        420;


      if (
        !Number.isFinite(
          aspectRatio,
        ) ||
        aspectRatio <=
          0
      ) {
        return {
          width,

          height:
            420,
        };
      }


      const rendererWidth =
        width -
        20;


      const rendererHeight =
        rendererWidth /
        aspectRatio;


      const height =
        clamp(
          rendererHeight +
          54,

          260,

          700,
        );


      return {
        width,

        height,
      };
    }


    case "document":
      return {
        width:
          430,

        height:
          560,
      };


    default:
      return {
        width:
          360,

        height:
          460,
      };
  }
}


function ViewportWindow({
  children,

  boundsRef,

  scale = 1,

  portalTargetRef,

  offset =
    null,

  onOffsetChange =
    null,

  size =
    null,

  onSizeChange =
    null,

  zIndex = 20,

  variant =
    "default",

  aspectRatio =
    null,

  ariaLabel =
    "Output window",

  showSave =
    false,

  canSave =
    false,

  onSave =
    null,
}) {
  const [
    isExpanded,
    setIsExpanded,
  ] =
    useState(
      false,
    );


  const dimensions =
    useMemo(
      () =>
        getWindowDimensions(
          variant,
          aspectRatio,
        ),
      [
        variant,
        aspectRatio,
      ],
    );


  const {
    dragRef,
    dragHandleProps,
    dragStyle,
  } =
    useDraggable({
      boundsRef,

      disabled:
        isExpanded,

      scale,

      preventDefault:
        false,

      ignoreSelector:
        '[data-window-selectable="true"], .resize-handle',

      offset,

      onOffsetChange,
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

      disabled:
        isExpanded,

      scale,

      minWidth:
        240,

      minHeight:
        180,

      maxWidth:
        1600,

      maxHeight:
        1200,

      /*
       * Output windows now use a true
       * top-left workspace base position.
       *
       * North/west resizing therefore moves
       * the persisted draggable offset while
       * east/south resizing leaves the top-left
       * corner fixed.
       */
      anchorMode:
        "top-left",

      size,

      onSizeChange,

      offset,

      onOffsetChange,
    });


  function toggleExpanded() {
    setIsExpanded(
      (
        current,
      ) =>
        !current,
    );
  }


  /*
   * IMPORTANT:
   *
   * Content scale comes only from the
   * window's persisted HEIGHT relative to
   * its own variant's default height.
   *
   * Width-only resizing leaves it unchanged,
   * matching Console's MessagePanel/
   * LightPanel convention.
   */
  const contentScale =
    getContentScale(
      resizedSize
        ?.height,

      dimensions.height,
    );


  const windowStyle = {
    ...dragStyle,
    ...resizeStyle,

    "--window-width":
      `${dimensions.width}px`,

    "--window-height":
      `${dimensions.height}px`,

    "--viewport-content-scale":
      contentScale,

    zIndex:
      isExpanded
        ? 1000
        : zIndex,
  };


  const window =
    (
      <section
        ref={
          dragRef
        }
        className={`viewport-window viewport-window-${variant} ${
          isExpanded
            ? "expanded"
            : ""
        }`}
        style={
          windowStyle
        }
        aria-label={
          ariaLabel
        }
        {...dragHandleProps}
      >
        <header className="viewport-window-header">
          <div className="viewport-window-controls">
            {showSave && (
              <button
                type="button"
                className="viewport-window-save-button"
                aria-label="Save output file"
                title={
                  canSave
                    ? "Save"
                    : "File is still loading"
                }
                disabled={
                  !canSave
                }
                onPointerDown={(
                  event,
                ) => {
                  event.stopPropagation();
                }}
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();


                  if (
                    canSave &&
                    typeof onSave ===
                      "function"
                  ) {
                    onSave();
                  }
                }}
              >
                ⇩
              </button>
            )}


            <button
              type="button"
              className="viewport-window-expand-button"
              aria-label={
                isExpanded
                  ? "Restore output window"
                  : "Maximize output window"
              }
              title={
                isExpanded
                  ? "Restore"
                  : "Maximize"
              }
              onPointerDown={(
                event,
              ) => {
                event.stopPropagation();
              }}
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                toggleExpanded();
              }}
            >
              {isExpanded
                ? "❐"
                : "□"}
            </button>
          </div>
        </header>


        <div className="viewport-window-body">
          <div
            className="viewport-window-renderer"
            onDoubleClick={(
              event,
            ) => {
              if (
                event.target instanceof
                  Element &&
                event.target.closest(
                  '[data-window-selectable="true"]',
                )
              ) {
                return;
              }


              event.stopPropagation();

              toggleExpanded();
            }}
          >
            {children}
          </div>
        </div>


        {!isExpanded &&
          RESIZE_DIRECTIONS.map(
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


  if (
    isExpanded &&
    portalTargetRef?.current
  ) {
    return createPortal(
      window,
      portalTargetRef.current,
    );
  }


  return window;
}


export default ViewportWindow;