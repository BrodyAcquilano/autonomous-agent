import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./Viewport.css";


const MIN_STAGE_WIDTH =
  3200;


const MIN_STAGE_HEIGHT =
  2200;


const EXTRA_STAGE_WIDTH =
  1800;


const EXTRA_STAGE_HEIGHT =
  1300;


const MIN_ZOOM =
  0.25;


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


function Viewport({
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
    scale = 1,
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
   * Runtime uses null when a fresh
   * Output workspace needs centering.
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


      commitView(
        getCenteredView(
          MIN_ZOOM,
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
     * Output windows own their
     * pointer interaction.
     *
     * This is what keeps window
     * dragging separate from stage
     * panning.
     */
    if (
      event.target instanceof
        Element &&
      event.target.closest(
        ".viewport-window",
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
        MIN_ZOOM,
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


  function handleWheel(
    event,
  ) {
    /*
     * Expanded windows are outside
     * the virtual stage.
     */
    if (
      event.target instanceof
        Element &&
      event.target.closest(
        ".viewport-window.expanded",
      )
    ) {
      return;
    }


    /*
     * Important:
     *
     * Do NOT ignore normal output
     * windows here.
     *
     * Wheel zoom therefore still
     * works while the cursor is over
     * an image/text/code window.
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


  /*
   * Output may provide normal JSX children
   * or a render function.
   *
   * The render-function form lets Output
   * use the exact virtual-stage dimensions
   * when calculating its automatic window
   * layout without moving DOM measurements
   * into Runtime.
   */
  const renderedChildren =
    typeof children ===
      "function"
      ? children({
          stageSize,
        })
      : children;


  /*
   * Output Viewport has only one
   * direct child type: ViewportWindow.
   *
   * Inject viewport-specific dragging
   * information directly into them.
   */
  const enhancedChildren =
    Children.map(
      renderedChildren,
      (
        child,
      ) => {
        if (
          !isValidElement(
            child,
          )
        ) {
          return child;
        }


        return cloneElement(
          child,
          {
            boundsRef:
              stageRef,

            scale:
              activeView.scale,

            portalTargetRef:
              expandedLayerRef,
          },
        );
      },
    );


  return (
    <div
      ref={
        containerRef
      }
      className={`output-viewport ${
        isPanning
          ? "is-panning"
          : ""
      }`}
      role="region"
      aria-label="Output workspace"
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
        className="output-viewport-stage"
        style={{
          width:
            `${stageSize.width}px`,

          height:
            `${stageSize.height}px`,

          transform:
            `translate(${activeView.x}px, ${activeView.y}px) scale(${activeView.scale})`,
        }}
      >
        {enhancedChildren}
      </div>


      <div
        ref={
          expandedLayerRef
        }
        className="output-viewport-expanded-layer"
      />


      <div
        className="output-viewport-scale"
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


export default Viewport;