/*
 * Shared, tree-agnostic geometry measurement for the
 * System Diagram page — used to report where each box in
 * each tree actually ended up (position, width, height),
 * relative to that tree's own container, so the page can
 * collect it all ahead of drawing connections later.
 *
 * Every tree lays itself out with plain CSS; there is no
 * rotation or transform anywhere on this page, so a box's
 * measured position is exactly where it visually sits —
 * no coordinate math needed beyond the measurement itself.
 */

/*
 * Measures `element`'s box relative to `ancestor`, using
 * offsetLeft/offsetTop/offsetWidth/offsetHeight rather
 * than getBoundingClientRect, so this stays correct
 * regardless of the current pan/zoom transform applied to
 * an ancestor further up the page (the System Diagram
 * viewport pans/zooms its whole canvas) — offsets ignore
 * `transform` entirely, getBoundingClientRect would not.
 *
 * Requires `ancestor` to be a positioned element
 * (`position: relative/absolute/...`) so it actually
 * terminates the offsetParent walk — see each tree's root
 * CSS class.
 */
export function measureRectRelativeTo(element, ancestor) {
  let x = 0;
  let y = 0;
  let node = element;

  while (node && node !== ancestor) {
    x += node.offsetLeft || 0;
    y += node.offsetTop || 0;
    node = node.offsetParent;
  }

  return {
    x,
    y,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}
