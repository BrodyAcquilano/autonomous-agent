import {
  useMemo,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import useDraggable from "../../../../Hooks/useDraggable";

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


      /*
       * Window structure:
       *
       * 34px header
       * 20px body padding
       * remaining area = image
       */
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
  portalTargetRef,

  scale = 1,

  zIndex = 20,

  variant =
    "default",

  aspectRatio =
    null,

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
    });


  const windowStyle = {
    ...dragStyle,

    "--window-start-x":
      `${initialOffset.x}px`,

    "--window-start-y":
      `${initialOffset.y}px`,

    "--window-width":
      `${dimensions.width}px`,

    "--window-height":
      `${dimensions.height}px`,

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