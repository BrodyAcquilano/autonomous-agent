import useDraggable from "../../../../Hooks/useDraggable";

import useResizable, {
  RESIZE_DIRECTIONS,
} from "../../../../Hooks/useResizable";

import "./LightPanel.css";


const STATUS_LABELS = {
  ready:
    "SYSTEM READY",

  busy:
    "SYSTEM BUSY",

  error:
    "SYSTEM ERROR",
};


const BASE_PANEL_WIDTH =
  210;


const BASE_PANEL_HEIGHT =
  58;


const BASE_FONT_SIZE =
  14;


const BASE_LIGHT_SIZE =
  11;


const BASE_LIGHT_GLOW =
  10;


const MIN_CONTENT_SCALE =
  0.8;


const MAX_CONTENT_SCALE =
  3;


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


function getMinimumPanelWidth(
  contentScale,
) {
  /*
   * Padding and gap stay fixed.
   *
   * Only the label glyphs and status light
   * grow with panel height, so the panel's
   * minimum width grows only enough to keep
   * that enlarged content from clipping.
   */
  const growth =
    (
      contentScale -
      1
    ) *
    112;


  return Math.max(
    180,

    BASE_PANEL_WIDTH +
      growth,
  );
}


function LightPanel({
  systemStatus =
    "ready",

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
        ".resize-handle",
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
        180,

      minHeight:
        46,

      maxWidth:
        460,

      maxHeight:
        220,

      anchorMode:
        "top-left",

      size,

      onSizeChange,

      offset,

      onOffsetChange,
    });


  const normalizedStatus =
    Object.prototype
      .hasOwnProperty.call(
        STATUS_LABELS,
        systemStatus,
      )
      ? systemStatus
      : "ready";


  /*
   * IMPORTANT:
   *
   * This scale is based only on the panel's
   * own persisted HEIGHT.
   *
   * It is completely independent from the
   * Console viewport zoom passed in as
   * `scale`.
   *
   * Horizontal-only resizing therefore does
   * not change the font/light size.
   */
  const contentScale =
    getContentScale(
      resizedSize
        ?.height,
    );


  const minimumPanelWidth =
    getMinimumPanelWidth(
      contentScale,
    );


  const panelStyle = {
    ...dragStyle,

    ...resizeStyle,

    minWidth:
      `${minimumPanelWidth}px`,

    "--light-panel-font-size":
      `${
        BASE_FONT_SIZE *
        contentScale
      }px`,

    "--light-panel-light-size":
      `${
        BASE_LIGHT_SIZE *
        contentScale
      }px`,

    "--light-panel-light-glow":
      `${
        BASE_LIGHT_GLOW *
        contentScale
      }px`,
  };


  return (
    <div
      ref={
        dragRef
      }
      className={`light-panel light-panel-${normalizedStatus}`}
      style={
        panelStyle
      }
      {...dragHandleProps}
    >
      <span className="light-panel-light" />


      <span className="light-panel-label">
        {
          STATUS_LABELS[
            normalizedStatus
          ]
        }
      </span>


      {RESIZE_DIRECTIONS.map(
        (
          direction,
        ) => (
          <span
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
    </div>
  );
}


export default LightPanel;