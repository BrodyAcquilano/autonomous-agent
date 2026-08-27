import {
  useEffect,
  useRef,
  useState,
} from "react";


const DRAG_THRESHOLD =
  4;


/* --------------------------------
   NORMALIZATION
-------------------------------- */

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


/* --------------------------------
   DRAGGABLE
-------------------------------- */

function useDraggable({
  boundsRef,

  disabled =
    false,

  scale =
    1,

  preventDefault =
    true,

  ignoreSelector =
    null,

  initialOffset = {
    x:
      0,

    y:
      0,
  },

  /*
   * Optional controlled position.
   *
   * When supplied, the component using
   * this hook owns the offset.
   */
  offset:
    controlledOffset =
      null,

  /*
   * Called whenever dragging changes
   * the offset.
   */
  onOffsetChange =
    null,
}) {
  const dragRef =
    useRef(
      null,
    );


  const dragStateRef =
    useRef(
      null,
    );


  const [
    internalOffset,
    setInternalOffset,
  ] =
    useState(
      () =>
        normalizeOffset(
          initialOffset,
        ),
    );


  const isControlled =
    controlledOffset !==
      null &&
    controlledOffset !==
      undefined;


  const activeOffset =
    isControlled
      ? normalizeOffset(
          controlledOffset,
        )
      : internalOffset;


  /*
   * Keep the current position available
   * synchronously to pointer handlers.
   *
   * This is especially important while
   * the viewport changes scale during
   * an active drag.
   */
  const offsetRef =
    useRef(
      activeOffset,
    );


  /*
   * Keep the current viewport scale in
   * a ref for active pointer handlers.
   */
  const scaleRef =
    useRef(
      normalizeScale(
        scale,
      ),
    );


  useEffect(
    () => {
      offsetRef.current =
        activeOffset;
    },
    [
      activeOffset.x,
      activeOffset.y,
    ],
  );


  /*
   * If the viewport zoom changes while
   * the pointer is still holding this
   * component, the original drag
   * measurements are no longer valid.
   *
   * Rebase the drag at the cursor's
   * current position using:
   *
   * - the newest scale
   * - the newest element rectangle
   * - the newest bounds rectangle
   * - the current drag offset
   *
   * This allows:
   *
   * drag → zoom → continue dragging
   *
   * without the component jumping or
   * escaping its bounds.
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


      const drag =
        dragStateRef.current;


      if (
        !drag
      ) {
        return;
      }


      const element =
        dragRef.current;


      const bounds =
        boundsRef?.current;


      if (
        !element ||
        !bounds
      ) {
        return;
      }


      /*
       * Restart the drag calculation
       * from wherever the pointer is
       * currently being held.
       */
      drag.startX =
        drag.lastX;


      drag.startY =
        drag.lastY;


      drag.startOffset = {
        ...offsetRef.current,
      };


      /*
       * These rectangles now reflect
       * the newly rendered zoom level.
       */
      drag.elementRect =
        element
          .getBoundingClientRect();


      drag.boundsRect =
        bounds
          .getBoundingClientRect();
    },
    [
      scale,
      boundsRef,
    ],
  );


  function updateOffset(
    nextOffset,
  ) {
    const normalized =
      normalizeOffset(
        nextOffset,
      );


    /*
     * Update immediately rather than
     * waiting for React to rerender.
     */
    offsetRef.current =
      normalized;


    if (
      !isControlled
    ) {
      setInternalOffset(
        normalized,
      );
    }


    if (
      typeof onOffsetChange ===
      "function"
    ) {
      onOffsetChange(
        normalized,
      );
    }
  }


  /* --------------------------------
     POINTER DOWN
  -------------------------------- */

  function handlePointerDown(
    event,
  ) {
    if (
      disabled ||
      event.button !==
        0
    ) {
      return;
    }


    if (
      ignoreSelector &&
      event.target instanceof
        Element &&
      event.target.closest(
        ignoreSelector,
      )
    ) {
      return;
    }


    const element =
      dragRef.current;


    const bounds =
      boundsRef?.current;


    if (
      !element ||
      !bounds
    ) {
      return;
    }


    dragStateRef.current = {
      pointerId:
        event.pointerId,

      /*
       * Current drag calculation
       * origin.
       */
      startX:
        event.clientX,

      startY:
        event.clientY,

      /*
       * Latest known cursor position.
       *
       * These are used to rebase the
       * drag if viewport scale changes.
       */
      lastX:
        event.clientX,

      lastY:
        event.clientY,

      /*
       * Current offset at the point
       * this drag calculation begins.
       */
      startOffset: {
        ...offsetRef.current,
      },

      /*
       * Screen-space geometry.
       *
       * These are recalculated if the
       * viewport zoom changes.
       */
      elementRect:
        element
          .getBoundingClientRect(),

      boundsRect:
        bounds
          .getBoundingClientRect(),

      isDragging:
        false,
    };
  }


  /* --------------------------------
     POINTER MOVE
  -------------------------------- */

  function handlePointerMove(
    event,
  ) {
    const drag =
      dragStateRef.current;


    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    /*
     * Always remember the newest
     * pointer location.
     *
     * Even if the pointer has barely
     * moved, a later zoom event may
     * need this position to rebase.
     */
    drag.lastX =
      event.clientX;


    drag.lastY =
      event.clientY;


    const pointerX =
      event.clientX -
      drag.startX;


    const pointerY =
      event.clientY -
      drag.startY;


    /*
     * Tiny pointer movement remains a
     * normal click rather than becoming
     * a drag.
     */
    if (
      !drag.isDragging
    ) {
      const distance =
        Math.hypot(
          pointerX,
          pointerY,
        );


      if (
        distance <
        DRAG_THRESHOLD
      ) {
        return;
      }


      drag.isDragging =
        true;


      try {
        event.currentTarget
          .setPointerCapture(
            event.pointerId,
          );
      } catch {
        /*
         * Pointer capture is only a
         * convenience here.
         */
      }


      if (
        preventDefault
      ) {
        event.preventDefault();
      }
    }


    /*
     * Geometry is stored in browser
     * screen coordinates.
     */
    const minimumX =
      drag.boundsRect.left -
      drag.elementRect.left;


    const maximumX =
      drag.boundsRect.right -
      drag.elementRect.right;


    const minimumY =
      drag.boundsRect.top -
      drag.elementRect.top;


    const maximumY =
      drag.boundsRect.bottom -
      drag.elementRect.bottom;


    const moveX =
      Math.min(
        Math.max(
          pointerX,
          minimumX,
        ),
        maximumX,
      );


    const moveY =
      Math.min(
        Math.max(
          pointerY,
          minimumY,
        ),
        maximumY,
      );


    /*
     * Pointer movement is measured in
     * screen pixels.
     *
     * Widget offsets are stored in
     * virtual-stage/world pixels, so
     * divide by the current scale.
     */
    const safeScale =
      scaleRef.current;


    updateOffset({
      x:
        drag.startOffset.x +
        (
          moveX /
          safeScale
        ),

      y:
        drag.startOffset.y +
        (
          moveY /
          safeScale
        ),
    });
  }


  /* --------------------------------
     FINISH DRAG
  -------------------------------- */

  function finishDrag(
    event,
  ) {
    const drag =
      dragStateRef.current;


    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    if (
      drag.isDragging
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
         * Pointer may already have
         * been released.
         */
      }
    }


    dragStateRef.current =
      null;
  }


  /* --------------------------------
     EVENT PROPS
  -------------------------------- */

  const dragHandleProps = {
    onPointerDown:
      handlePointerDown,

    onPointerMove:
      handlePointerMove,

    onPointerUp:
      finishDrag,

    onPointerCancel:
      finishDrag,
  };


  /* --------------------------------
     STYLE
  -------------------------------- */

  const dragStyle = {
    "--drag-x":
      `${activeOffset.x}px`,

    "--drag-y":
      `${activeOffset.y}px`,
  };


  return {
    dragRef,

    dragHandleProps,

    dragStyle,

    offset:
      activeOffset,
  };
}


export default useDraggable;