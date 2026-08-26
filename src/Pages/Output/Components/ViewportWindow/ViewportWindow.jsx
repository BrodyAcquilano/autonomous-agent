import {
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import useDraggable from "../../../../Hooks/useDraggable";

import "./ViewportWindow.css";


function ViewportWindow({
  children,

  boundsRef,
  portalTargetRef,

  scale = 1,

  zIndex = 20,

  initialOffset = {
    x:
      0,

    y:
      0,
  },

  ariaLabel =
    "Output window",
}) {
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
    });


  const windowStyle = {
    ...dragStyle,

    "--window-start-x":
      `${initialOffset.x}px`,

    "--window-start-y":
      `${initialOffset.y}px`,

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
        className={`viewport-window ${
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
      >
        <header
          className="viewport-window-header"
          {...dragHandleProps}
        >
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
            onClick={() => {
              setIsExpanded(
                (
                  current,
                ) =>
                  !current,
              );
            }}
          >
            {isExpanded
              ? "❐"
              : "□"}
          </button>
        </header>


        <div className="viewport-window-body">
          <div className="viewport-window-renderer">
            {children}
          </div>
        </div>
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