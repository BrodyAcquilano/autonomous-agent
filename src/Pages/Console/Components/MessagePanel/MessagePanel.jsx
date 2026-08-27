import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import useDraggable from "../../../../Hooks/useDraggable";

import useResizable, {
  RESIZE_DIRECTIONS,
} from "../../../../Hooks/useResizable";

import "./MessagePanel.css";


/* --------------------------------
   HEIGHT-DRIVEN CONTENT SCALE
-------------------------------- */

const BASE_PANEL_HEIGHT =
  572;


const BASE_TITLE_FONT_SIZE =
  14;


const BASE_MESSAGE_FONT_SIZE =
  13;


const BASE_LABEL_FONT_SIZE =
  10;


const BASE_EMPTY_FONT_SIZE =
  11;


const BASE_BUTTON_FONT_SIZE =
  12;


const BASE_BUTTON_WIDTH =
  22;


const BASE_BUTTON_HEIGHT =
  20;


const BASE_HEADER_HEIGHT =
  38;


/*
 * Existing typography is the minimum.
 *
 * Making the panel shorter therefore gives
 * the message screen less visible space,
 * but it never makes the text smaller.
 */
const MIN_CONTENT_SCALE =
  1;


/*
 * MessagePanel currently allows a maximum
 * height of 1200px:
 *
 * 1200 / 572 ~= 2.10
 */
const MAX_CONTENT_SCALE =
  2.1;


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


function MessagePanel({
  messages,

  boundsRef,

  scale = 1,

  offset,

  onOffsetChange,

  size,

  onSizeChange,

  portalTargetRef,
}) {
  const messageScreenRef =
    useRef(
      null,
    );


  const [
    isExpanded,
    setIsExpanded,
  ] =
    useState(
      false,
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

      offset,

      onOffsetChange,

      /*
       * The outer glass shell and its
       * padding are draggable.
       *
       * The actual message surface,
       * window button, and resize handles
       * keep their own interactions.
       */
      ignoreSelector:
        '.message-panel-screen, .message-panel-window-button, .resize-handle',
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
        320,

      minHeight:
        260,

      maxWidth:
        1500,

      maxHeight:
        1200,

      anchorMode:
        "top-left",

      size,

      onSizeChange,

      offset,

      onOffsetChange,
    });


  /*
   * IMPORTANT:
   *
   * Internal content scale comes only from
   * the panel's persisted HEIGHT.
   *
   * Console viewport zoom is still used by
   * drag/resize pointer math, but viewport
   * zoom itself does not change typography.
   *
   * Width-only resizing also leaves these
   * values unchanged.
   */
  const contentScale =
    getContentScale(
      resizedSize
        ?.height,
    );


  const panelStyle = {
    ...dragStyle,

    ...resizeStyle,

    "--message-panel-title-font-size":
      `${
        BASE_TITLE_FONT_SIZE *
        contentScale
      }px`,

    "--message-panel-message-font-size":
      `${
        BASE_MESSAGE_FONT_SIZE *
        contentScale
      }px`,

    "--message-panel-label-font-size":
      `${
        BASE_LABEL_FONT_SIZE *
        contentScale
      }px`,

    "--message-panel-empty-font-size":
      `${
        BASE_EMPTY_FONT_SIZE *
        contentScale
      }px`,

    "--message-panel-button-font-size":
      `${
        BASE_BUTTON_FONT_SIZE *
        contentScale
      }px`,

    "--message-panel-button-width":
      `${
        BASE_BUTTON_WIDTH *
        contentScale
      }px`,

    "--message-panel-button-height":
      `${
        BASE_BUTTON_HEIGHT *
        contentScale
      }px`,

    "--message-panel-header-height":
      `${
        BASE_HEADER_HEIGHT +
        (
          contentScale -
          1
        ) *
        18
      }px`,
  };


  useEffect(
    () => {
      const screen =
        messageScreenRef.current;


      if (
        !screen
      ) {
        return;
      }


      /*
       * Do not use scrollIntoView here.
       *
       * This panel lives inside a transformed
       * virtual viewport. scrollIntoView can
       * scroll ancestor containers as well as
       * this inner message surface, which can
       * make the whole Console appear to pan
       * when a new message is appended.
       *
       * Scroll only the message surface itself.
       */
      const frame =
        window.requestAnimationFrame(
          () => {
            screen.scrollTo({
              top:
                screen.scrollHeight,

              behavior:
                "smooth",
            });
          },
        );


      return () => {
        window.cancelAnimationFrame(
          frame,
        );
      };
    },
    [
      messages,
    ],
  );


  function toggleExpanded() {
    setIsExpanded(
      (
        current,
      ) =>
        !current,
    );
  }


  const panel =
    (
      <section
        ref={
          dragRef
        }
        className={`message-panel ${
          isExpanded
            ? "expanded"
            : ""
        }`}
        style={
          panelStyle
        }
        {...dragHandleProps}
      >
        <div className="message-panel-header">
          <span className="message-panel-title">
            CONSOLE OUTPUT
          </span>


          <div className="message-panel-controls">
            <button
              type="button"
              className="message-panel-window-button"
              aria-label={
                isExpanded
                  ? "Restore console window"
                  : "Maximize console window"
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
        </div>


        <div
          ref={
            messageScreenRef
          }
          className="message-panel-screen"
          data-console-wheel-scroll="true"
        >
          {messages.length ===
          0 ? (
            <div className="message-panel-empty">
              AWAITING INPUT...
            </div>
          ) : (
            <div className="message-list">
              {messages.map(
                (
                  message,
                ) => (
                  <div
                    key={
                      message.id
                    }
                    className={`message ${message.role}`}
                  >
                    <div className="message-label">
                      {message.label}
                    </div>


                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
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
      panel,
      portalTargetRef.current,
    );
  }


  return panel;
}


export default MessagePanel;