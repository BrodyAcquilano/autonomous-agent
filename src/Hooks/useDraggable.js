import {
  useRef,
  useState,
} from "react";


function useDraggable({
  boundsRef,
  disabled = false,
  scale = 1,
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
    offset,
    setOffset,
  ] =
    useState({
      x:
        0,

      y:
        0,
    });


  const handlePointerDown = (
    event,
  ) => {
    if (
      disabled ||
      event.button !==
        0
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


    const elementRect =
      element.getBoundingClientRect();


    const boundsRect =
      bounds.getBoundingClientRect();


    dragStateRef.current = {
      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      startOffset: {
        ...offset,
      },

      elementRect,

      boundsRect,
    };


    event.currentTarget.setPointerCapture(
      event.pointerId,
    );


    event.preventDefault();
  };


  const handlePointerMove = (
    event,
  ) => {
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


    setOffset({
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
  };


  const finishDrag = (
    event,
  ) => {
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
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }


    dragStateRef.current =
      null;
  };


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
      `${offset.x}px`,

    "--drag-y":
      `${offset.y}px`,
  };


  return {
    dragRef,

    dragHandleProps,

    dragStyle,
  };
}


export default useDraggable;