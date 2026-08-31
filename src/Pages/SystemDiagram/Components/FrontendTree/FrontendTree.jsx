import { useLayoutEffect, useRef, useState } from "react";

import useTreeGeometry from "../../useTreeGeometry";

import "./FrontendTree.css";

/*
 * A single shared 3-column grid, 4 rows deep: callers
 * (top), pages, App.jsx's own loading hooks, App.jsx itself
 * (bottom, spanning the full row — it isn't part of the
 * flank/gap system, it's the foundation everything above
 * sits on). Runtime.jsx isn't drawn at all: its state is
 * just App.jsx's own behavior injected at runtime, not a
 * separate structural entity with any external caller of
 * its own.
 *
 * The pages row is NOT split evenly: Console and Output
 * (which get their data from direct user action via the
 * caller row, not from an App.jsx loading hook) sit alone
 * in the left flank; every other page — the ones App.jsx
 * loads data for on mount, plus System Diagram, which loads
 * nothing — sits in the right flank. That split is what
 * opens up a center gap exactly as wide as the loading-
 * hooks row below it (same shared `auto` column trick used
 * everywhere else on this page): each hook can draw a
 * straight line down through that gap to its own server API
 * route without crossing anything, and the hooks row itself
 * reads as sitting "underneath" the wide space between
 * Console/Output and the rest.
 *
 * The caller row mirrors the pages row's exact split for
 * the same reason as always — a caller belongs to a
 * component, a component belongs to a page, so a caller has
 * to move with its page's slot. Console/Output/Analytics/
 * Maintenance are the only pages with a modeled caller;
 * Analytics and Maintenance's callers now sit in the first
 * two slots of the (six-wide) right flank, since that's
 * where those two pages themselves now are.
 *
 * Page (and caller) boxes don't flex to fill their flank —
 * every one is pinned to the SAME fixed width, measured from
 * whichever page label is actually longest (no hardcoding:
 * see the two-pass measurement below). With every box a
 * fixed width, `justify-content: space-between` on the flank
 * does the rest: any room left over becomes even gaps
 * between the boxes, natively — no manual gap math needed.
 * Pages are ordered left-to-right exactly as they appear in
 * the app's own navigation tabs.
 */
function CallerBox({ id, lines, width, registerBox }) {
  return (
    <div
      ref={registerBox(id)}
      className="sysdiag-frontend-caller"
      style={width ? { flex: `0 0 ${width}px` } : undefined}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function PageBox({ id, label, width, registerPageBox }) {
  return (
    <div
      ref={registerPageBox(id)}
      className="sysdiag-frontend-page"
      style={width ? { flex: `0 0 ${width}px` } : undefined}
    >
      {label}
    </div>
  );
}

function PagesFlank({ pages, width, registerPageBox }) {
  return (
    <div className="sysdiag-frontend-pages-flank">
      {pages.map((page) => (
        <PageBox key={page.id} id={page.id} label={page.label} width={width} registerPageBox={registerPageBox} />
      ))}
    </div>
  );
}

const CALLERS_BY_PAGE_ID = {
  console: { id: "caller-console-shell", lines: ["CommandShell", "(Console)"] },
  output: { id: "caller-output-hook", lines: ["useResponseOutput", "hook (Output)"] },
  analytics: { id: "caller-analytics-handler", lines: ["Analytics.jsx", "action handler"] },
  maintenance: { id: "caller-maintenance-handlers", lines: ["Maintenance.jsx", "action handlers"] },
};

function CallersFlank({ pages, width, registerBox }) {
  return (
    <div className="sysdiag-frontend-callers-flank">
      {pages.map((page) => {
        const caller = CALLERS_BY_PAGE_ID[page.id];

        if (!caller) {
          return (
            <div
              key={page.id}
              className="sysdiag-frontend-caller-empty"
              style={width ? { flex: `0 0 ${width}px` } : undefined}
              aria-hidden="true"
            />
          );
        }

        return <CallerBox key={page.id} id={caller.id} lines={caller.lines} width={width} registerBox={registerBox} />;
      })}
    </div>
  );
}

/*
 * App.jsx's own loading hooks — one per page that gets its
 * data from App.jsx on mount, rather than from a direct
 * caller action. Console/Output/System Diagram have no
 * entry here on purpose: the first two are caller-driven,
 * and System Diagram is a static, hand-curated page with no
 * data to load at all.
 */
const HOOKS = [
  { id: "hook-capabilities", lines: ["loadModelsAndApis()", "+ tools/capabilities"] },
  { id: "hook-agents", lines: ["loadAgents()"] },
  { id: "hook-directory", lines: ["loadDirectory()"] },
  { id: "hook-maintenance", lines: ["loadMaintenanceTickets()", "loadMaintenanceLogs()"] },
  { id: "hook-analytics", lines: ["loadAnalyticsLogs()"] },
];

function HookBox({ id, lines, registerBox }) {
  return (
    <div ref={registerBox(id)} className="sysdiag-frontend-hook">
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function HooksRow({ registerBox }) {
  return (
    <div className="sysdiag-frontend-hooks-row">
      {HOOKS.map((hook) => (
        <HookBox key={hook.id} id={hook.id} lines={hook.lines} registerBox={registerBox} />
      ))}
    </div>
  );
}

const PAGES = [
  { id: "console", label: "Console.jsx" },
  { id: "output", label: "Output.jsx" },
  { id: "analytics", label: "Analytics.jsx" },
  { id: "maintenance", label: "Maintenance.jsx" },
  { id: "agents", label: "Agents.jsx" },
  { id: "directory", label: "Directory.jsx" },
  { id: "capabilities", label: "Capabilities.jsx" },
  { id: "system-diagram", label: "SystemDiagram.jsx" },
];

const LEFT_PAGES = PAGES.slice(0, 2);
const RIGHT_PAGES = PAGES.slice(2);

function FrontendTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  const pageElementsRef = useRef(new Map());
  const hasMeasuredPageWidthRef = useRef(false);

  const [pageBoxWidth, setPageBoxWidth] = useState(null);


  function registerPageBox(id) {
    return (element) => {
      registerBox(`page-${id}`)(element);

      if (element) {
        pageElementsRef.current.set(id, element);
      } else {
        pageElementsRef.current.delete(id);
      }
    };
  }


  /*
   * Measures every page box's own natural (unpinned) width
   * and takes the max — that becomes the fixed width
   * applied to every page/caller box. `hasMeasuredPageWidthRef`
   * captures it exactly once; the ResizeObserver exists so
   * this stays correct if a label's rendered width ever
   * changes for external reasons (e.g. a font finishing
   * its own async load) rather than assuming a single
   * measurement on mount is always final.
   */
  useLayoutEffect(() => {
    function measurePageWidth() {
      if (hasMeasuredPageWidthRef.current) {
        return;
      }

      let maxWidth = 0;

      pageElementsRef.current.forEach((element) => {
        maxWidth = Math.max(maxWidth, element.offsetWidth);
      });

      if (maxWidth > 0) {
        hasMeasuredPageWidthRef.current = true;
        setPageBoxWidth(maxWidth);
      }
    }

    measurePageWidth();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(measurePageWidth);

    pageElementsRef.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);


  return (
    <div ref={contentRef} className="sysdiag-frontend-tree">
      <div className="sysdiag-frontend-label">REACT (frontend root)</div>

      <div className="sysdiag-frontend-center-grid">
        <CallersFlank pages={LEFT_PAGES} width={pageBoxWidth} registerBox={registerBox} />
        <div className="sysdiag-frontend-pages-gap" aria-hidden="true" />
        <CallersFlank pages={RIGHT_PAGES} width={pageBoxWidth} registerBox={registerBox} />

        <PagesFlank pages={LEFT_PAGES} width={pageBoxWidth} registerPageBox={registerPageBox} />
        <div className="sysdiag-frontend-pages-gap" aria-hidden="true" />
        <PagesFlank pages={RIGHT_PAGES} width={pageBoxWidth} registerPageBox={registerPageBox} />

        <div className="sysdiag-frontend-center-spacer" />
        <HooksRow registerBox={registerBox} />
        <div className="sysdiag-frontend-center-spacer" />

        <div ref={registerBox("app")} className="sysdiag-frontend-app-full">App.jsx</div>
      </div>
    </div>
  );
}

export default FrontendTree;
