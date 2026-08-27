import {
  useEffect,
  useRef,
  useState,
} from "react";


const DRAG_THRESHOLD =
  4;


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
   * Pointer handlers need the newest
   * offset without depending on the
   * timing of React renders.
   */
  const offsetRef =
    useRef(
      activeOffset,
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

      startX:
        event.clientX,

      startY:
        event.clientY,

      startOffset: {
        ...offsetRef.current,
      },

      elementRect:
        element.getBoundingClientRect(),

      boundsRect:
        bounds.getBoundingClientRect(),

      isDragging:
        false,
    };
  }


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


    const safeScale =
      Number.isFinite(
        scale,
      ) &&
      scale >
        0
        ? scale
        : 1;


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