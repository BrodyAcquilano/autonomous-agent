import { useLayoutEffect, useRef } from "react";

import { measureRectRelativeTo } from "./geometry";


/*
 * Shared by every tree on the System Diagram page.
 *
 * A tree lays itself out with plain CSS, same as any other
 * page — no rotation, no transform, no JS-computed sizing.
 * This hook just watches that layout (via `contentRef`,
 * and one `registerBox(id)` ref per box worth tracking)
 * and reports each box's real position/size, relative to
 * the tree's own container, up to the caller — so geometry
 * for the whole diagram can be collected at the page level
 * ahead of drawing connections later.
 */
function useTreeGeometry(onGeometryChange) {
  const contentRef = useRef(null);
  const boxElementsRef = useRef(new Map());


  function registerBox(id) {
    return (element) => {
      if (element) {
        boxElementsRef.current.set(id, element);
      } else {
        boxElementsRef.current.delete(id);
      }
    };
  }


  useLayoutEffect(() => {
    const contentEl = contentRef.current;

    if (!contentEl) {
      return undefined;
    }

    function measure() {
      const width = contentEl.offsetWidth;
      const height = contentEl.offsetHeight;

      if (width <= 0 || height <= 0 || typeof onGeometryChange !== "function") {
        return;
      }

      const boxes = {};

      boxElementsRef.current.forEach((element, id) => {
        boxes[id] = measureRectRelativeTo(element, contentEl);
      });

      onGeometryChange({ containerSize: { width, height }, boxes });
    }

    measure();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(contentEl);
    boxElementsRef.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);


  return { contentRef, registerBox };
}


export default useTreeGeometry;
