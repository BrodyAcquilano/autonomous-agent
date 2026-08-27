import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ConsoleViewport.css";


const MIN_STAGE_WIDTH =
  2500;


const MIN_STAGE_HEIGHT =
  1500;


const EXTRA_STAGE_WIDTH =
  900;


const EXTRA_STAGE_HEIGHT =
  700;


const DEFAULT_MIN_ZOOM =
  0.4;


const ABSOLUTE_MIN_ZOOM =
  0.12;


const MAX_ZOOM =
  1.8;


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


function normalizeView(
  value,
) {
  return {
    x:
      Number.isFinite(
        value?.x,
      )
        ? value.x
        : 0,

    y:
      Number.isFinite(
        value?.y,
      )
        ? value.y
        : 0,

    scale:
      Number.isFinite(
        value?.scale,
      ) &&
      value.scale >
        0
        ? value.scale
        : 1,
  };
}


function getInitialScale(
  viewportWidth,
) {
  if (
    viewportWidth <=
    720
  ) {
    return 0.55;
  }


  if (
    viewportWidth <=
    1100
  ) {
    return 0.7;
  }


  return 0.82;
}


function getMinimumZoom(
  viewportSize,
  stageSize,
) {
  if (
    viewportSize.width <=
      0 ||
    viewportSize.height <=
      0 ||
    stageSize.width <=
      0 ||
    stageSize.height <=
      0
  ) {
    return DEFAULT_MIN_ZOOM;
  }


  /*
   * Console has less vertical room than
   * Output because the CommandShell lives
   * below it.
   *
   * Allow the complete virtual stage to
   * fit inside the actual Console viewport,
   * even on shorter screens.
   */
  const fitScale =
    Math.min(
      viewportSize.width /
        stageSize.width,

      viewportSize.height /
        stageSize.height,
    );


  return Math.max(
    ABSOLUTE_MIN_ZOOM,

    Math.min(
      DEFAULT_MIN_ZOOM,
      fitScale,
    ),
  );
}


function ConsoleViewport({
  children,

  view =
    null,

  onViewChange =
    null,
}) {
  const containerRef =
    useRef(
      null,
    );


  const stageRef =
    useRef(
      null,
    );


  const expandedLayerRef =
    useRef(
      null,
    );


  const panRef =
    useRef({
      active:
        false,

      pointerId:
        null,

      startX:
        0,

      startY:
        0,

      startViewX:
        0,

      startViewY:
        0,
    });


  const viewRef =
    useRef(
      normalizeView(
        view,
      ),
    );


  const [
    viewportSize,
    setViewportSize,
  ] =
    useState({
      width:
        0,

      height:
        0,
    });


  const [
    isPanning,
    setIsPanning,
  ] =
    useState(
      false,
    );


  const activeView =
    view
      ? normalizeView(
          view,
        )
      : viewRef.current;


  useEffect(
    () => {
      if (
        view
      ) {
        viewRef.current =
          normalizeView(
            view,
          );
      }
    },
    [
      view,
    ],
  );


  useEffect(
    () => {
      const element =
        containerRef.current;


      if (
        !element
      ) {
        return;
      }


      function updateSize() {
        const rect =
          element
            .getBoundingClientRect();


        setViewportSize({
          width:
            rect.width,

          height:
            rect.height,
        });
      }


      updateSize();


      if (
        typeof ResizeObserver ===
        "undefined"
      ) {
        window.addEventListener(
          "resize",
          updateSize,
        );


        return () => {
          window.removeEventListener(
            "resize",
            updateSize,
          );
        };
      }


      const observer =
        new ResizeObserver(
          updateSize,
        );


      observer.observe(
        element,
      );


      return () => {
        observer.disconnect();
      };
    },
    [],
  );


  const stageSize =
    useMemo(
      () => ({
        width:
          Math.max(
            MIN_STAGE_WIDTH,

            viewportSize.width +
            EXTRA_STAGE_WIDTH,
          ),

        height:
          Math.max(
            MIN_STAGE_HEIGHT,

            viewportSize.height +
            EXTRA_STAGE_HEIGHT,
          ),
      }),
      [
        viewportSize.width,
        viewportSize.height,
      ],
    );


  const minimumZoom =
    useMemo(
      () =>
        getMinimumZoom(
          viewportSize,
          stageSize,
        ),
      [
        viewportSize.width,
        viewportSize.height,

        stageSize.width,
        stageSize.height,
      ],
    );


  function commitView(
    nextValue,
  ) {
    const normalized =
      normalizeView(
        nextValue,
      );


    viewRef.current =
      normalized;


    if (
      typeof onViewChange ===
      "function"
    ) {
      onViewChange(
        normalized,
      );
    }
  }


  function getCenteredView(
    scale,
  ) {
    return {
      scale,

      x:
        (
          viewportSize.width -
          (
            stageSize.width *
            scale
          )
        ) /
        2,

      y:
        (
          viewportSize.height -
          (
            stageSize.height *
            scale
          )
        ) /
        2,
    };
  }


  function constrainPosition(
    x,
    y,
    scale,
  ) {
    const scaledWidth =
      stageSize.width *
      scale;


    const scaledHeight =
      stageSize.height *
      scale;


    let constrainedX;


    let constrainedY;


    if (
      scaledWidth >=
      viewportSize.width
    ) {
      constrainedX =
        clamp(
          x,

          viewportSize.width -
          scaledWidth,

          0,
        );
    } else {
      constrainedX =
        (
          viewportSize.width -
          scaledWidth
        ) /
        2;
    }


    if (
      scaledHeight >=
      viewportSize.height
    ) {
      constrainedY =
        clamp(
          y,

          viewportSize.height -
          scaledHeight,

          0,
        );
    } else {
      constrainedY =
        (
          viewportSize.height -
          scaledHeight
        ) /
        2;
    }


    return {
      x:
        constrainedX,

      y:
        constrainedY,
    };
  }


  /*
   * Runtime uses null to mean this
   * viewport has never initialized.
   */
  useEffect(
    () => {
      if (
        view !==
          null ||
        viewportSize.width <=
          0 ||
        viewportSize.height <=
          0
      ) {
        return;
      }


      const scale =
        getInitialScale(
          viewportSize.width,
        );


      commitView(
        getCenteredView(
          scale,
        ),
      );
    },
    [
      view,

      viewportSize.width,
      viewportSize.height,

      stageSize.width,
      stageSize.height,
    ],
  );


  function handlePointerDown(
    event,
  ) {
    if (
      event.button !==
      0
    ) {
      return;
    }


    /*
     * Widgets control their own
     * dragging.
     */
    if (
      event.target instanceof
        Element &&
      event.target.closest(
        ".light-panel, .message-panel, .request-control-panel",
      )
    ) {
      return;
    }


    const current =
      viewRef.current;


    panRef.current = {
      active:
        true,

      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      startViewX:
        current.x,

      startViewY:
        current.y,
    };


    setIsPanning(
      true,
    );


    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId,
        );
    } catch {
      /*
       * Pointer capture is optional.
       */
    }
  }


  function handlePointerMove(
    event,
  ) {
    const pan =
      panRef.current;


    if (
      !pan.active ||
      pan.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const current =
      viewRef.current;


    const deltaX =
      event.clientX -
      pan.startX;


    const deltaY =
      event.clientY -
      pan.startY;


    const constrained =
      constrainPosition(
        pan.startViewX +
          deltaX,

        pan.startViewY +
          deltaY,

        current.scale,
      );


    commitView({
      ...current,

      x:
        constrained.x,

      y:
        constrained.y,
    });
  }


  function endPan(
    event,
  ) {
    const pan =
      panRef.current;


    if (
      !pan.active
    ) {
      return;
    }


    if (
      event &&
      pan.pointerId ===
        event.pointerId
    ) {
      try {
        if (
          event.currentTarget
            .hasPointerCapture(
              event.pointerId,
            )
        ) {
          event.currentTarget
            .releasePointerCapture(
              event.pointerId,
            );
        }
      } catch {
        /*
         * Pointer may already
         * be released.
         */
      }
    }


    panRef.current = {
      active:
        false,

      pointerId:
        null,

      startX:
        0,

      startY:
        0,

      startViewX:
        0,

      startViewY:
        0,
    };


    setIsPanning(
      false,
    );
  }


  function zoomAtPoint(
    nextScale,
    pointX,
    pointY,
  ) {
    const current =
      viewRef.current;


    const newScale =
      clamp(
        nextScale,
        minimumZoom,
        MAX_ZOOM,
      );


    if (
      newScale ===
      current.scale
    ) {
      return;
    }


    const worldX =
      (
        pointX -
        current.x
      ) /
      current.scale;


    const worldY =
      (
        pointY -
        current.y
      ) /
      current.scale;


    const nextX =
      pointX -
      (
        worldX *
        newScale
      );


    const nextY =
      pointY -
      (
        worldY *
        newScale
      );


    const constrained =
      constrainPosition(
        nextX,
        nextY,
        newScale,
      );


    commitView({
      scale:
        newScale,

      x:
        constrained.x,

      y:
        constrained.y,
    });
  }


  function canInnerElementScroll(
    element,
    deltaY,
  ) {
    if (
      !element ||
      element.scrollHeight <=
        element.clientHeight
    ) {
      return false;
    }


    if (
      deltaY <
      0
    ) {
      return (
        element.scrollTop >
        0
      );
    }


    if (
      deltaY >
      0
    ) {
      return (
        element.scrollTop +
          element.clientHeight <
        element.scrollHeight -
          1
      );
    }


    return false;
  }


  function handleWheel(
    event,
  ) {
    if (
      event.target instanceof
        Element
    ) {
      /*
       * Expanded MessagePanel is outside
       * the virtual stage. Let its message
       * surface use normal wheel scrolling.
       */
      if (
        event.target.closest(
          ".message-panel.expanded",
        )
      ) {
        return;
      }


      /*
       * Scrollable widget content consumes
       * wheel movement only while it can
       * actually scroll in that direction.
       *
       * At its edge, the same wheel gesture
       * falls through to viewport zoom.
       */
      const scrollArea =
        event.target.closest(
          '[data-console-wheel-scroll="true"]',
        );


      if (
        scrollArea &&
        canInnerElementScroll(
          scrollArea,
          event.deltaY,
        )
      ) {
        return;
      }
    }


    /*
     * Form controls no longer block zoom.
     *
     * preventDefault also prevents a
     * focused number input from stepping
     * while the user is zooming.
     */
    event.preventDefault();


    const container =
      containerRef.current;


    if (
      !container
    ) {
      return;
    }


    const rect =
      container
        .getBoundingClientRect();


    const pointX =
      event.clientX -
      rect.left;


    const pointY =
      event.clientY -
      rect.top;


    const current =
      viewRef.current;


    const zoomFactor =
      Math.exp(
        -event.deltaY *
        0.0015,
      );


    zoomAtPoint(
      current.scale *
        zoomFactor,

      pointX,

      pointY,
    );
  }

  const renderedChildren =
    typeof children ===
      "function"
      ? children({
          boundsRef:
            stageRef,

          scale:
            activeView.scale,

          portalTargetRef:
            expandedLayerRef,
        })
      : children;


  return (
    <div
      ref={
        containerRef
      }
      className={`console-viewport ${
        isPanning
          ? "is-panning"
          : ""
      }`}
      role="region"
      aria-label="Console workspace"
      onPointerDown={
        handlePointerDown
      }
      onPointerMove={
        handlePointerMove
      }
      onPointerUp={
        endPan
      }
      onPointerCancel={
        endPan
      }
      onWheel={
        handleWheel
      }
    >
      <div
        ref={
          stageRef
        }
        className="console-viewport-stage"
        style={{
          width:
            `${stageSize.width}px`,

          height:
            `${stageSize.height}px`,

          transform:
            `translate(${activeView.x}px, ${activeView.y}px) scale(${activeView.scale})`,
        }}
      >
        {renderedChildren}
      </div>


      <div
        ref={
          expandedLayerRef
        }
        className="console-viewport-expanded-layer"
      />


      <div
        className="console-viewport-scale"
        aria-hidden="true"
      >
        {Math.round(
          activeView.scale *
          100,
        )}
        %
      </div>
    </div>
  );
}


export default ConsoleViewport;