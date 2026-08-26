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
  2200;


const MIN_STAGE_HEIGHT =
  1500;


const EXTRA_STAGE_WIDTH =
  1200;


const EXTRA_STAGE_HEIGHT =
  900;


const MIN_ZOOM =
  0.4;


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


function Viewport({
  children,
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


  const initializedRef =
    useRef(
      false,
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


  const [
    view,
    setView,
  ] =
    useState({
      x:
        0,

      y:
        0,

      scale:
        1,
    });


  /*
   * Measure actual visible
   * viewport size.
   */
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
          element.getBoundingClientRect();


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


  /*
   * Virtual workspace is always
   * larger than the visible page.
   */
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


  /*
   * Keep the virtual stage from
   * being completely dragged away.
   */
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
   * Center virtual stage the first
   * time its dimensions are known.
   */
  useEffect(
    () => {
      if (
        initializedRef.current ||
        viewportSize.width <=
          0 ||
        viewportSize.height <=
          0
      ) {
        return;
      }


      initializedRef.current =
        true;


      setView(
        getCenteredView(
          1,
        ),
      );
    },
    [
      viewportSize.width,
      viewportSize.height,
      stageSize.width,
      stageSize.height,
    ],
  );


  /*
   * Pan only when clicking the
   * workspace itself.
   *
   * Output windows manage their
   * own pointer interaction.
   */
  function handlePointerDown(
    event,
  ) {
    if (
      event.button !==
      0
    ) {
      return;
    }


    if (
      event.target.closest(
        ".viewport-window",
      )
    ) {
      return;
    }


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
        view.x,

      startViewY:
        view.y,
    };


    setIsPanning(
      true,
    );


    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
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

        view.scale,
      );


    setView(
      (
        current,
      ) => ({
        ...current,

        x:
          constrained.x,

        y:
          constrained.y,
      }),
    );
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
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        );
      } catch {
        /*
         * Pointer may already have
         * been released.
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


  /*
   * Zoom while preserving the
   * world point under the cursor.
   */
  function zoomAtPoint(
    nextScale,
    pointX,
    pointY,
  ) {
    setView(
      (
        current,
      ) => {
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
          return current;
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


        return {
          scale:
            newScale,

          x:
            constrained.x,

          y:
            constrained.y,
        };
      },
    );
  }


  function handleWheel(
    event,
  ) {
    /*
     * Later renderers such as PDFs
     * may need their own scrolling.
     */
    if (
      event.target.closest(
        ".viewport-window",
      )
    ) {
      return;
    }


    event.preventDefault();


    const container =
      containerRef.current;


    if (
      !container
    ) {
      return;
    }


    const rect =
      container.getBoundingClientRect();


    const pointX =
      event.clientX -
      rect.left;


    const pointY =
      event.clientY -
      rect.top;


    const zoomFactor =
      Math.exp(
        -event.deltaY *
        0.0015,
      );


    zoomAtPoint(
      view.scale *
        zoomFactor,

      pointX,

      pointY,
    );
  }


  const enhancedChildren =
    Children.map(
      children,
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
              view.scale,

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
            `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
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
          view.scale *
          100,
        )}
        %
      </div>
    </div>
  );
}


export default Viewport;