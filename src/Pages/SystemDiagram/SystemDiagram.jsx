import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import MongoTree from "./Components/MongoTree/MongoTree";
import AzureTree from "./Components/AzureTree/AzureTree";
import AgentsTree from "./Components/AgentsTree/AgentsTree";
import ServerTree from "./Components/ServerTree/ServerTree";
import FrontendTree from "./Components/FrontendTree/FrontendTree";
import ConnectionsLayer from "./Components/ConnectionsLayer/ConnectionsLayer";
import { measureRectRelativeTo } from "./geometry";

import "./SystemDiagram.css";


const MIN_ZOOM = 0.1;


const MAX_ZOOM = 2.5;


/*
 * Which grid cell each tree lives in — used to translate a
 * tree's own box positions (reported relative to that
 * tree's container) into the shared canvas coordinate
 * space the connections layer draws in, by adding that
 * cell's own canvas-relative offset.
 */
const TREE_CELL_IDS = {
  azure: "1-1",
  agents: "1-3",
  mongo: "2-2",
  server: "3-1",
  frontend: "4-1",
};


function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}


function toCanvasSpaceBoxes(treeBoxes, cellRect) {
  if (!treeBoxes || !cellRect) {
    return {};
  }

  const result = {};

  Object.entries(treeBoxes).forEach(([id, box]) => {
    result[id] = { x: box.x + cellRect.x, y: box.y + cellRect.y, width: box.width, height: box.height };
  });

  return result;
}


/*
 * A read-only architecture diagram, hand-curated from
 * the actual codebase and the live `directory`
 * collection rather than generated from either — the
 * directory doesn't model frontend components/pages as
 * entities, so this can't be derived automatically yet.
 * Entirely self-contained: no props in, no Runtime
 * state, nothing to keep in sync with the rest of the
 * app other than updating this page by hand when the
 * real architecture changes.
 *
 * Five trees on a 4-row x 3-column grid, one tree per
 * cell, the rest of the cells left empty:
 *   Row 1: [ Azure OpenAI | empty    | Agents   ]
 *   Row 2: [ empty        | Database | empty    ]
 *   Row 3: [ Server       | empty    | empty    ]
 *   Row 4: [ Frontend     | empty    | empty    ]
 * Azure OpenAI, Server, and Frontend all share column 1;
 * Database sits alone in column 2; Agents sits alone in
 * column 3. The Azure OpenAI tree is the real, code-true
 * structure (Model Deployments + Containers — see its own
 * file) that Server's internal-operations routes actually
 * call; the Agents tree (Router/Analyst/Maintenance/Worker)
 * is kept in its own column deliberately separate from
 * that, since agent behavior is prompt-level configuration,
 * not a distinct Azure structural entity — connecting it
 * into the rest of this diagram is a later, separate piece
 * of work. Database's own internal alignment mirrors (see
 * its own CSS), so its collections face left, toward
 * Server. No tree is rotated or transformed; every one
 * lays out with plain CSS at its own natural size, and
 * each column is exactly as wide as its widest cell / each
 * row exactly as tall as its tallest cell — there is no
 * forced equal sizing.
 *
 * The grid itself has no size limit of its own; it lives
 * on an absolutely-positioned canvas that a pannable,
 * wheel-zoomable viewport pans/scales, so overflow is
 * handled once at the outermost container instead of
 * being clipped or scrolled inside individual cells.
 * Connection lines between the trees are a separate,
 * later step — see the project conversation this page
 * was built from.
 */
function SystemDiagram() {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const hasAutoFitRef = useRef(false);

  const panRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startViewX: 0,
    startViewY: 0,
  });

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);

  /*
   * Geometry bookkeeping for the connections layer: every
   * tree reports its own boxes' position/size here
   * (relative to that tree's own container), and every
   * grid cell reports its own position/size relative to
   * the canvas — the two combine (see `toCanvasSpaceBoxes`
   * below) into one shared coordinate space the connection
   * paths are drawn in. Real state, not refs, since the
   * connections layer needs to re-render whenever any of
   * this changes.
   */
  const [treeGeometry, setTreeGeometry] = useState({});
  const [cellGeometry, setCellGeometry] = useState({});
  const cellElementsRef = useRef(new Map());


  function registerCell(id) {
    return (element) => {
      if (element) {
        cellElementsRef.current.set(id, element);
      } else {
        cellElementsRef.current.delete(id);
      }
    };
  }


  function handleTreeGeometryChange(treeName) {
    return (geometry) => {
      setTreeGeometry((previous) => ({ ...previous, [treeName]: geometry }));
    };
  }


  useLayoutEffect(() => {
    const canvasEl = canvasRef.current;

    if (!canvasEl) {
      return undefined;
    }

    function measureCells() {
      const next = {};

      cellElementsRef.current.forEach((element, id) => {
        next[id] = measureRectRelativeTo(element, canvasEl);
      });

      setCellGeometry(next);
    }

    measureCells();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(measureCells);

    cellElementsRef.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);


  function commitView(nextView) {
    viewRef.current = nextView;
    setView(nextView);
  }


  /*
   * Scales the canvas down (never up past 100%) so its
   * full natural size lands inside the viewport in one
   * shot — this is what lets a diagram far larger than
   * the screen still be seen whole without touching a
   * scrollbar.
   */
  function fitToView() {
    const viewportEl = viewportRef.current;
    const canvasEl = canvasRef.current;

    if (!viewportEl || !canvasEl) {
      return;
    }

    const viewportRect = viewportEl.getBoundingClientRect();
    const naturalWidth = canvasEl.offsetWidth;
    const naturalHeight = canvasEl.offsetHeight;

    if (naturalWidth <= 0 || naturalHeight <= 0 || viewportRect.width <= 0 || viewportRect.height <= 0) {
      return;
    }

    const scale = clamp(
      Math.min(viewportRect.width / naturalWidth, viewportRect.height / naturalHeight),
      MIN_ZOOM,
      1,
    );

    commitView({
      scale,
      x: (viewportRect.width - (naturalWidth * scale)) / 2,
      y: (viewportRect.height - (naturalHeight * scale)) / 2,
    });
  }


  function resetView() {
    hasAutoFitRef.current = true;
    fitToView();
  }


  /*
   * Auto-fits exactly once, the first time both the
   * viewport and the canvas have a real measured size —
   * never again after that, so it never fights a zoom or
   * pan the user has already made.
   */
  useLayoutEffect(() => {
    const viewportEl = viewportRef.current;
    const canvasEl = canvasRef.current;

    if (!viewportEl || !canvasEl) {
      return undefined;
    }

    function handleResize() {
      if (!hasAutoFitRef.current) {
        fitToView();
        hasAutoFitRef.current = true;
      }
    }

    handleResize();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(handleResize);

    observer.observe(viewportEl);
    observer.observe(canvasEl);

    return () => {
      observer.disconnect();
    };
  }, []);


  function handleWheel(event) {
    event.preventDefault();

    const viewportEl = viewportRef.current;

    if (!viewportEl) {
      return;
    }

    const rect = viewportEl.getBoundingClientRect();
    const pointX = event.clientX - rect.left;
    const pointY = event.clientY - rect.top;

    const current = viewRef.current;
    const zoomFactor = Math.exp(-event.deltaY * 0.0015);
    const nextScale = clamp(current.scale * zoomFactor, MIN_ZOOM, MAX_ZOOM);

    if (nextScale === current.scale) {
      return;
    }

    const worldX = (pointX - current.x) / current.scale;
    const worldY = (pointY - current.y) / current.scale;

    commitView({
      scale: nextScale,
      x: pointX - (worldX * nextScale),
      y: pointY - (worldY * nextScale),
    });
  }


  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest(".system-diagram-viewport-controls")) {
      return;
    }

    const current = viewRef.current;

    panRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startViewX: current.x,
      startViewY: current.y,
    };

    setIsPanning(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is optional. */
    }
  }


  function handlePointerMove(event) {
    const pan = panRef.current;

    if (!pan.active || pan.pointerId !== event.pointerId) {
      return;
    }

    commitView({
      ...viewRef.current,
      x: pan.startViewX + (event.clientX - pan.startX),
      y: pan.startViewY + (event.clientY - pan.startY),
    });
  }


  function endPan(event) {
    const pan = panRef.current;

    if (!pan.active) {
      return;
    }

    if (event && pan.pointerId === event.pointerId) {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* Pointer may already be released. */
      }
    }

    panRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startViewX: 0,
      startViewY: 0,
    };

    setIsPanning(false);
  }


  const mongoCanvasBoxes = toCanvasSpaceBoxes(treeGeometry.mongo?.boxes, cellGeometry[TREE_CELL_IDS.mongo]);
  const serverCanvasBoxes = toCanvasSpaceBoxes(treeGeometry.server?.boxes, cellGeometry[TREE_CELL_IDS.server]);
  const frontendCanvasBoxes = toCanvasSpaceBoxes(treeGeometry.frontend?.boxes, cellGeometry[TREE_CELL_IDS.frontend]);


  return (
    <main className="system-diagram-page" role="region" aria-label="System Diagram">
      <header className="system-diagram-header">
        <span className="system-diagram-eyebrow">SYSTEM DIAGRAM</span>
        <h1>Architecture</h1>
        <p>
          Five trees on a 4×3 grid — Database, Azure OpenAI, Agents, Server, and Frontend.
          Read-only, hand-curated from the codebase. Scroll to zoom, drag to pan.
        </p>
      </header>

      <div
        ref={viewportRef}
        className={`system-diagram-viewport ${isPanning ? "is-panning" : ""}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          ref={canvasRef}
          className="system-diagram-canvas"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          <div className="system-diagram-grid">
            <div ref={registerCell("1-1")} className="system-diagram-cell system-diagram-cell-1-1">
              <AzureTree onGeometryChange={handleTreeGeometryChange("azure")} />
            </div>
            <div ref={registerCell("1-2")} className="system-diagram-cell system-diagram-cell-1-2" />
            <div ref={registerCell("1-3")} className="system-diagram-cell system-diagram-cell-1-3">
              <AgentsTree onGeometryChange={handleTreeGeometryChange("agents")} />
            </div>

            <div ref={registerCell("2-1")} className="system-diagram-cell system-diagram-cell-2-1" />
            <div ref={registerCell("2-2")} className="system-diagram-cell system-diagram-cell-2-2">
              <MongoTree onGeometryChange={handleTreeGeometryChange("mongo")} />
            </div>
            <div ref={registerCell("2-3")} className="system-diagram-cell system-diagram-cell-2-3" />

            <div ref={registerCell("3-1")} className="system-diagram-cell system-diagram-cell-3-1">
              <ServerTree onGeometryChange={handleTreeGeometryChange("server")} />
            </div>
            <div ref={registerCell("3-2")} className="system-diagram-cell system-diagram-cell-3-2" />
            <div ref={registerCell("3-3")} className="system-diagram-cell system-diagram-cell-3-3" />

            <div ref={registerCell("4-1")} className="system-diagram-cell system-diagram-cell-4-1">
              <FrontendTree onGeometryChange={handleTreeGeometryChange("frontend")} />
            </div>
            <div ref={registerCell("4-2")} className="system-diagram-cell system-diagram-cell-4-2" />
            <div ref={registerCell("4-3")} className="system-diagram-cell system-diagram-cell-4-3" />
          </div>

          <ConnectionsLayer
            mongoBoxes={mongoCanvasBoxes}
            serverBoxes={serverCanvasBoxes}
            frontendBoxes={frontendCanvasBoxes}
          />
        </div>

        <div className="system-diagram-viewport-controls">
          <button type="button" className="system-diagram-reset-view" onClick={resetView}>
            Reset View
          </button>
          <span className="system-diagram-viewport-scale">{Math.round(view.scale * 100)}%</span>
        </div>
      </div>
    </main>
  );
}

export default SystemDiagram;
