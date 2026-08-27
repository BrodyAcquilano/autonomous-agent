import {
  useEffect,
  useRef,
  useState,
} from "react";


export const RESIZE_DIRECTIONS = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];


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


function normalizeScale(
  value,
) {
  return (
    Number.isFinite(
      value,
    ) &&
    value >
      0
      ? value
      : 1
  );
}


function normalizeSize(
  value,
) {
  return {
    width:
      Number.isFinite(
        value?.width,
      )
        ? value.width
        : null,

    height:
      Number.isFinite(
        value?.height,
      )
        ? value.height
        : null,
  };
}


function normalizeOffset(
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
  };
}


function useResizable({
  targetRef,

  disabled =
    false,

  scale =
    1,

  minWidth =
    120,

  minHeight =
    48,

  maxWidth =
    1800,

  maxHeight =
    1400,

  anchorMode =
    "top-left",

  /*
   * Optional controlled dimensions.
   *
   * Runtime can own these so resized
   * windows keep their dimensions when
   * a page unmounts and mounts again.
   */
  size:
    controlledSize =
      null,

  onSizeChange =
    null,

  /*
   * Existing draggable offset.
   *
   * Resizing from the north/west sides
   * changes the window's position too.
   * Updating the real draggable offset
   * makes that movement persistent rather
   * than keeping a temporary local shift.
   */
  offset:
    controlledOffset =
      null,

  onOffsetChange =
    null,
}) {
  const resizeStateRef =
    useRef(
      null,
    );


  const scaleRef =
    useRef(
      normalizeScale(
        scale,
      ),
    );


  const sizeRef =
    useRef(
      normalizeSize(
        controlledSize,
      ),
    );


  const offsetRef =
    useRef(
      normalizeOffset(
        controlledOffset,
      ),
    );


  /*
   * Fallback shift only matters if this
   * hook is ever used without a parent
   * position callback.
   */
  const shiftRef =
    useRef({
      x:
        0,

      y:
        0,
    });


  const [
    size,
    setSize,
  ] =
    useState(
      () =>
        normalizeSize(
          controlledSize,
        ),
    );


  const [
    shift,
    setShift,
  ] =
    useState({
      x:
        0,

      y:
        0,
    });


  useEffect(
    () => {
      if (
        controlledSize ===
          null ||
        controlledSize ===
          undefined
      ) {
        return;
      }


      const nextSize =
        normalizeSize(
          controlledSize,
        );


      sizeRef.current =
        nextSize;


      setSize(
        nextSize,
      );
    },
    [
      controlledSize
        ?.width,
      controlledSize
        ?.height,
    ],
  );


  useEffect(
    () => {
      offsetRef.current =
        normalizeOffset(
          controlledOffset,
        );
    },
    [
      controlledOffset
        ?.x,
      controlledOffset
        ?.y,
    ],
  );


  function updateSize(
    nextSize,
  ) {
    const normalized =
      normalizeSize(
        nextSize,
      );


    sizeRef.current =
      normalized;


    /*
     * Keep the visual resize immediate,
     * even when Runtime is controlling the
     * persisted value.
     */
    setSize(
      normalized,
    );


    if (
      typeof onSizeChange ===
      "function"
    ) {
      onSizeChange(
        normalized,
      );
    }
  }


  function updateOffset(
    nextOffset,
  ) {
    const normalized =
      normalizeOffset(
        nextOffset,
      );


    offsetRef.current =
      normalized;


    if (
      typeof onOffsetChange ===
      "function"
    ) {
      onOffsetChange(
        normalized,
      );
    }
  }


  function updateShift(
    nextShift,
  ) {
    shiftRef.current =
      nextShift;


    setShift(
      nextShift,
    );
  }


  /*
   * If viewport zoom changes during an
   * active resize, rebase the operation
   * at the current cursor position.
   */
  useEffect(
    () => {
      const nextScale =
        normalizeScale(
          scale,
        );


      const previousScale =
        scaleRef.current;


      scaleRef.current =
        nextScale;


      if (
        previousScale ===
        nextScale
      ) {
        return;
      }


      const resize =
        resizeStateRef.current;


      if (
        !resize
      ) {
        return;
      }


      resize.startX =
        resize.lastX;


      resize.startY =
        resize.lastY;


      resize.startWidth =
        Number.isFinite(
          sizeRef.current
            .width,
        )
          ? sizeRef.current
              .width
          : resize.startWidth;


      resize.startHeight =
        Number.isFinite(
          sizeRef.current
            .height,
        )
          ? sizeRef.current
              .height
          : resize.startHeight;


      resize.startOffset = {
        ...offsetRef.current,
      };


      resize.startShift = {
        ...shiftRef.current,
      };
    },
    [
      scale,
    ],
  );


  function beginResize(
    direction,
    event,
  ) {
    if (
      disabled ||
      event.button !==
        0
    ) {
      return;
    }


    const element =
      targetRef?.current;


    if (
      !element
    ) {
      return;
    }


    event.preventDefault();

    event.stopPropagation();


    const safeScale =
      scaleRef.current;


    const rect =
      element
        .getBoundingClientRect();


    const measuredWidth =
      rect.width /
      safeScale;


    const measuredHeight =
      rect.height /
      safeScale;


    const startWidth =
      Number.isFinite(
        sizeRef.current
          .width,
      )
        ? sizeRef.current
            .width
        : measuredWidth;


    const startHeight =
      Number.isFinite(
        sizeRef.current
          .height,
      )
        ? sizeRef.current
            .height
        : measuredHeight;


    resizeStateRef.current = {
      direction,

      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      lastX:
        event.clientX,

      lastY:
        event.clientY,

      startWidth,

      startHeight,

      startOffset: {
        ...offsetRef.current,
      },

      startShift: {
        ...shiftRef.current,
      },
    };


    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId,
        );
    } catch {
      /*
       * Pointer capture is a convenience.
       */
    }
  }


  function handlePointerMove(
    event,
  ) {
    const resize =
      resizeStateRef.current;


    if (
      !resize ||
      resize.pointerId !==
        event.pointerId
    ) {
      return;
    }


    resize.lastX =
      event.clientX;


    resize.lastY =
      event.clientY;


    const safeScale =
      scaleRef.current;


    const deltaX =
      (
        event.clientX -
        resize.startX
      ) /
      safeScale;


    const deltaY =
      (
        event.clientY -
        resize.startY
      ) /
      safeScale;


    const {
      direction,
      startWidth,
      startHeight,
      startOffset,
      startShift,
    } =
      resize;


    let nextWidth =
      startWidth;


    let nextHeight =
      startHeight;


    if (
      direction.includes(
        "e",
      )
    ) {
      nextWidth =
        startWidth +
        deltaX;
    }


    if (
      direction.includes(
        "w",
      )
    ) {
      nextWidth =
        startWidth -
        deltaX;
    }


    if (
      direction.includes(
        "s",
      )
    ) {
      nextHeight =
        startHeight +
        deltaY;
    }


    if (
      direction.includes(
        "n",
      )
    ) {
      nextHeight =
        startHeight -
        deltaY;
    }


    nextWidth =
      clamp(
        nextWidth,
        minWidth,
        maxWidth,
      );


    nextHeight =
      clamp(
        nextHeight,
        minHeight,
        maxHeight,
      );


    const widthChange =
      nextWidth -
      startWidth;


    const heightChange =
      nextHeight -
      startHeight;


    let positionChangeX =
      0;


    let positionChangeY =
      0;


    if (
      anchorMode ===
      "center"
    ) {
      if (
        direction.includes(
          "e",
        )
      ) {
        positionChangeX +=
          widthChange /
          2;
      }


      if (
        direction.includes(
          "w",
        )
      ) {
        positionChangeX -=
          widthChange /
          2;
      }


      if (
        direction.includes(
          "s",
        )
      ) {
        positionChangeY +=
          heightChange /
          2;
      }


      if (
        direction.includes(
          "n",
        )
      ) {
        positionChangeY -=
          heightChange /
          2;
      }
    } else {
      /*
       * Top-left anchored panels only
       * move when their top or left edge
       * is the edge being resized.
       */
      if (
        direction.includes(
          "w",
        )
      ) {
        positionChangeX -=
          widthChange;
      }


      if (
        direction.includes(
          "n",
        )
      ) {
        positionChangeY -=
          heightChange;
      }
    }


    updateSize({
      width:
        nextWidth,

      height:
        nextHeight,
    });


    if (
      typeof onOffsetChange ===
      "function"
    ) {
      updateOffset({
        x:
          startOffset.x +
          positionChangeX,

        y:
          startOffset.y +
          positionChangeY,
      });


      /*
       * Runtime now owns the actual
       * position movement.
       */
      if (
        shiftRef.current.x !==
          0 ||
        shiftRef.current.y !==
          0
      ) {
        updateShift({
          x:
            0,

          y:
            0,
        });
      }
    } else {
      /*
       * Backward-compatible fallback for
       * an uncontrolled use of the hook.
       */
      updateShift({
        x:
          startShift.x +
          positionChangeX,

        y:
          startShift.y +
          positionChangeY,
      });
    }
  }


  function finishResize(
    event,
  ) {
    const resize =
      resizeStateRef.current;


    if (
      !resize ||
      resize.pointerId !==
        event.pointerId
    ) {
      return;
    }


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
       * Pointer may already be released.
       */
    }


    resizeStateRef.current =
      null;
  }


  function getResizeHandleProps(
    direction,
  ) {
    return {
      onPointerDown: (
        event,
      ) => {
        beginResize(
          direction,
          event,
        );
      },

      onPointerMove:
        handlePointerMove,

      onPointerUp:
        finishResize,

      onPointerCancel:
        finishResize,

      onLostPointerCapture:
        finishResize,

      "data-resize-direction":
        direction,

      "aria-hidden":
        "true",
    };
  }


  const resizeStyle = {
    "--resize-shift-x":
      `${shift.x}px`,

    "--resize-shift-y":
      `${shift.y}px`,
  };


  if (
    Number.isFinite(
      size.width,
    )
  ) {
    resizeStyle[
      "--resize-width"
    ] =
      `${size.width}px`;
  }


  if (
    Number.isFinite(
      size.height,
    )
  ) {
    resizeStyle[
      "--resize-height"
    ] =
      `${size.height}px`;
  }


  return {
    resizeStyle,

    getResizeHandleProps,

    size,
  };
}


export default useResizable;