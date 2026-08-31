import { useLayoutEffect, useRef, useState } from "react";

import useTreeGeometry from "../../useTreeGeometry";

import "./FrontendTree.css";

/*
 * An ownership box, not several separately-aligned sibling
 * rows: App.jsx is the one outer box, and everything it
 * owns — the pages row and its own loading-hooks row — is
 * nested directly inside that same border. A caller
 * (CommandShell, useResponseOutput, a page's own action
 * handler) is nested one level deeper still, inside the
 * specific page box it belongs to — a caller belongs to a
 * component, a component belongs to a page, a page belongs
 * to App.jsx, so that's exactly how the boxes nest.
 * Runtime.jsx isn't drawn at all: its state is just App.jsx's
 * own behavior injected at runtime, not a separate
 * structural entity with any external caller of its own.
 * Connections still attach to whichever box actually makes
 * the call (a caller, or a hook) regardless of how many
 * boxes it's nested inside.
 *
 * Inside App.jsx, the pages row is NOT split evenly: Console
 * and Output (caller-driven, not loaded by an App.jsx hook)
 * sit alone in the left flank; every other page — the ones
 * App.jsx loads data for on mount, plus System Diagram,
 * which loads nothing — sits in the right flank. That split
 * opens a center gap exactly as wide as the loading-hooks
 * row below it (the same shared `auto` column trick used
 * everywhere else on this page): each hook can draw a
 * straight line down through that gap to its own server API
 * route without crossing anything.
 *
 * Page (and nested caller) boxes don't flex to fill their
 * flank — every page box is pinned to the SAME fixed width,
 * measured from whichever page's own content (label, plus
 * its caller if it has one) is actually the widest (no
 * hardcoding: see the two-pass measurement below). With
 * every page box a fixed width, `justify-content: space-
 * between` on the flank does the rest: any room left over
 * becomes even gaps between the boxes, natively. Pages are
 * ordered left-to-right exactly as they appear in the app's
 * own navigation tabs.
 */
const CALLERS_BY_PAGE_ID = {
  console: { id: "caller-console-shell", lines: ["CommandShell", "(Console)"] },
  output: { id: "caller-output-hook", lines: ["useResponseOutput", "hook (Output)"] },
  analytics: { id: "caller-analytics-handler", lines: ["Analytics.jsx", "action handler"] },
  maintenance: { id: "caller-maintenance-handlers", lines: ["Maintenance.jsx", "action handlers"] },
};

function PageBox({ id, label, width, registerPageBox, registerBox }) {
  const caller = CALLERS_BY_PAGE_ID[id];

  return (
    <div
      ref={registerPageBox(id)}
      className="sysdiag-frontend-page"
      style={width ? { flex: `0 0 ${width}px` } : undefined}
    >
      <div className="sysdiag-frontend-page-title">{label}</div>

      {caller && (
        <div ref={registerBox(caller.id)} className="sysdiag-frontend-caller">
          {caller.lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PagesFlank({ pages, width, registerPageBox, registerBox }) {
  return (
    <div className="sysdiag-frontend-pages-flank">
      {pages.map((page) => (
        <PageBox
          key={page.id}
          id={page.id}
          label={page.label}
          width={width}
          registerPageBox={registerPageBox}
          registerBox={registerBox}
        />
      ))}
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
/*
 * Ordered left-to-right to match their respective routes'
 * own order in the Server tree's row, to keep the
 * hook -> route connection lines from crossing.
 */
const HOOKS = [
  { id: "hook-directory", lines: ["loadDirectory()"] },
  { id: "hook-agents", lines: ["loadAgents()"] },
  { id: "hook-capabilities", lines: ["loadModelsAndApis()", "+ tools/capabilities"] },
  { id: "hook-analytics", lines: ["loadAnalyticsLogs()"] },
  { id: "hook-maintenance", lines: ["loadMaintenanceTickets()", "loadMaintenanceLogs()"] },
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
   * — including any caller nested inside it — and takes the
   * max, which becomes the fixed width applied to every page
   * box. `hasMeasuredPageWidthRef` captures it exactly once;
   * the ResizeObserver exists so this stays correct if a
   * label's rendered width ever changes for external reasons
   * (e.g. a font finishing its own async load) rather than
   * assuming a single measurement on mount is always final.
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

      <div ref={registerBox("app")} className="sysdiag-frontend-app-box">
        <div className="sysdiag-frontend-app-title">App.jsx</div>

        <div className="sysdiag-frontend-app-grid">
          <div className="sysdiag-frontend-center-spacer" />
          <div className="sysdiag-frontend-app-gap" aria-hidden="true" />
          <div className="sysdiag-frontend-center-spacer" />

          <PagesFlank pages={LEFT_PAGES} width={pageBoxWidth} registerPageBox={registerPageBox} registerBox={registerBox} />
          <div className="sysdiag-frontend-pages-gap" aria-hidden="true" />
          <PagesFlank pages={RIGHT_PAGES} width={pageBoxWidth} registerPageBox={registerPageBox} registerBox={registerBox} />

          <div className="sysdiag-frontend-center-spacer" />
          <HooksRow registerBox={registerBox} />
          <div className="sysdiag-frontend-center-spacer" />
        </div>
      </div>
    </div>
  );
}

export default FrontendTree;
