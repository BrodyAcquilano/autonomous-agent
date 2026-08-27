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
        style={{
          ...dragStyle,
          ...resizeStyle,
        }}
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