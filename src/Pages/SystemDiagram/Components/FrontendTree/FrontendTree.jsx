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
 * Inside App.jsx, the pages row is NOT split evenly, and NOT
 * into just two flanks either — it's five columns, matching
 * five columns in the loading-hooks row directly beneath, and
 * every column has content in EXACTLY ONE of the two rows:
 *   Pages: [Console, Output] [ gap ] [Analytics] [ gap ] [the rest of the pages]
 *   Hooks: [  gap  ] [directory, agents, capabilities, analytics] [ gap ] [maintenance] [ gap ]
 * Console/Output aren't App.jsx-loaded, so their column has no
 * hook beneath it. The first four hooks share one column with
 * nothing above them. Maintenance's own loading hook is pulled
 * out into its own column, alone, so ITS column's pages-row cell
 * is a real gap — clearance for its connection line to rise
 * straight up through the pages row without crossing a page box
 * that would otherwise sit there. Analytics.jsx's page is
 * likewise pulled out of "the rest of the pages" into that same
 * gap column, rather than leaving it an unused blank space.
 * Since every column only ever has real content in one row,
 * each `auto` column naturally sizes to whichever row's content
 * needs it — no measuring across rows required, same as
 * everywhere else on this page.
 *
 * Every page box also nests the real UI components that page
 * renders (see `PAGE_COMPONENTS` below), one level deeper still
 * — same "title, then what it owns" pattern, and nested exactly
 * how those components actually render relative to each other,
 * not just listed flat:
 *   - A component that itself renders further sub-components
 *     (Output's ViewportWindow choosing one of six type-specific
 *     renderers, itself rendered INSIDE Viewport — possibly more
 *     than one at a time) nests those the same way, via `nested`.
 *   - Whichever component is the one that actually MAKES the
 *     page's own API call gets that call nested one level deeper
 *     inside IT specifically, via `caller` — Console's CommandShell
 *     is a real rendered component, so its handler lives nested
 *     inside CommandShell's own box, at the same row-level as
 *     every other component Console renders, not stacked above
 *     them as if it were something separate.
 *   - Where the caller ISN'T attributable to any one specific
 *     child component — Output's `useResponseOutput` hook is
 *     presumed to live in Output.jsx itself, not inside Viewport
 *     or any component under it; Analytics.jsx's `handleDelete()`
 *     is likewise defined in the PAGE itself and merely passed
 *     down to AnalyticsLogModal as an `onDelete` prop, rather
 *     than being defined inside that modal — it's listed as its
 *     own entry directly in `PAGE_COMPONENTS`, a plain SIBLING of
 *     whatever it sits beside, never stacked above the row:
 *     stacking would wrongly imply sequencing (call, THEN render),
 *     when really they're just two different things that exist
 *     at the same time.
 * Pages with no caller of their own (Agents, Directory,
 * Capabilities) just have no caller entry anywhere in their list.
 * There's no longer any "one caller box stacked above the
 * components row" shape anywhere — every caller this page draws
 * is confirmed to live directly in ITS OWN page component (never
 * in a modal/panel it's merely passed down to), so every one of
 * them is a sibling entry in `PAGE_COMPONENTS`, not a separate
 * box above the row.
 *
 * Maintenance has FIVE separate callers, all confirmed defined in
 * Maintenance.jsx and passed down as props (`onSubmitMaintenanceRequest`
 * to FilterPanel; `onMarkReviewed`/`onIgnore`/`onRestart` to
 * TicketModal; `onDelete` to MaintenanceLogModal) rather than
 * defined inside any of those components themselves:
 *   - `handleSubmitMaintenanceRequest()` calls `requestMaintenanceApi`
 *     (`request-maintenance`).
 *   - `handleMarkReviewed()` and `handleIgnore()` both call
 *     `maintenanceApi` (`maintenance-crud`).
 *   - `handleRestart()` calls `requestServiceApi` — `request-service`,
 *     NOT `request-maintenance`; the connections layer still draws
 *     a `caller-maintenance-handlers` box on that route, which no
 *     longer exists now that this box is broken into its real
 *     named callers, so that line needs its own pass next.
 *   - `handleDeleteLog()` calls `maintenanceApi` (`maintenance-crud`).
 * System Diagram isn't listed at all — it's this diagram itself,
 * not a real feature page to document.
 *
 * No page box is pinned to a shared width anymore: now that
 * every page nests a different amount of content, forcing them
 * all to one common width would either pad out the small ones
 * for no reason or clip the large ones — each just sizes to its
 * own natural content instead, same as every other box on this
 * page.
 */
const PAGE_COMPONENTS = {
  console: [
    { label: "ConsoleViewport" },
    { label: "LightPanel" },
    { label: "SuggestedRequestSettingsPanel" },
    { label: "MessagePanel" },
    { label: "CommandShell", caller: { id: "caller-console-shell", lines: ["handleSubmit()"] } },
  ],
  output: [
    { id: "caller-output-hook", lines: ["useResponseOutput", "hook (Output)"] },
    {
      label: "Viewport",
      nested: [
        {
          label: "ViewportWindow",
          nested: [
            { label: "ImageRenderer" },
            { label: "PdfRenderer" },
            { label: "MarkdownRenderer" },
            { label: "CodeRenderer" },
            { label: "TextRenderer" },
            { label: "UnknownRenderer" },
          ],
        },
      ],
    },
  ],
  analytics: [
    { label: "StatusIndicator" },
    { label: "FilterPanel" },
    { label: "EntryList" },
    { label: "AnalyticsLogModal" },
    { id: "caller-analytics-handler", lines: ["handleDelete()"] },
  ],
  maintenance: [
    { label: "StatusIndicator" },
    { label: "FilterPanel" },
    { label: "EntryList" },
    { label: "TicketModal" },
    { label: "MaintenanceLogModal" },
    { id: "caller-maintenance-restart", lines: ["handleRestart()"] },
    { id: "caller-maintenance-delete-log", lines: ["handleDeleteLog()"] },
    { id: "caller-maintenance-mark-reviewed", lines: ["handleMarkReviewed()"] },
    { id: "caller-maintenance-ignore", lines: ["handleIgnore()"] },
    { id: "caller-maintenance-submit-request", lines: ["handleSubmitMaintenanceRequest()"] },
  ],
  agents: [
    { label: "AgentCard" },
    { label: "AgentInfoModal" },
  ],
  directory: [
    { label: "DisplayCard" },
    { label: "DirectoryInfoModal" },
  ],
  capabilities: [
    { label: "DisplayCard" },
    { label: "ModelInfoModal" },
  ],
};

function CallerBox({ id, lines, registerBox }) {
  return (
    <div ref={registerBox(id)} className="sysdiag-frontend-caller">
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function ComponentBox({ label, nested, caller, registerBox }) {
  return (
    <div className="sysdiag-frontend-component">
      <div className="sysdiag-frontend-component-title">{label}</div>
      {caller && <CallerBox id={caller.id} lines={caller.lines} registerBox={registerBox} />}
      {nested && <ComponentsRow components={nested} registerBox={registerBox} />}
    </div>
  );
}

/*
 * A row can mix two kinds of entry: a plain component (has its
 * own `label`) and a bare caller sitting as a direct sibling
 * rather than nested inside any one component (has `id`/`lines`
 * instead — see the `output` entry in PAGE_COMPONENTS).
 */
function ComponentsRow({ components, registerBox }) {
  return (
    <div className="sysdiag-frontend-components-row">
      {components.map((component) => (
        component.id ? (
          <CallerBox key={component.id} id={component.id} lines={component.lines} registerBox={registerBox} />
        ) : (
          <ComponentBox
            key={component.label}
            label={component.label}
            nested={component.nested}
            caller={component.caller}
            registerBox={registerBox}
          />
        )
      ))}
    </div>
  );
}

function PageBox({ id, label, registerBox }) {
  const components = PAGE_COMPONENTS[id];

  return (
    <div className="sysdiag-frontend-page">
      <div className="sysdiag-frontend-page-title">{label}</div>

      {components && <ComponentsRow components={components} registerBox={registerBox} />}
    </div>
  );
}

function PagesFlank({ pages, registerBox }) {
  return (
    <div className="sysdiag-frontend-pages-flank">
      {pages.map((page) => (
        <PageBox key={page.id} id={page.id} label={page.label} registerBox={registerBox} />
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

function HooksRow({ hooks, registerBox }) {
  return (
    <div className="sysdiag-frontend-hooks-row">
      {hooks.map((hook) => (
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

const PAGES_COLUMN_1 = PAGES.slice(0, 2); // Console, Output
const PAGES_COLUMN_3 = PAGES.slice(2, 3); // Analytics, alone
const PAGES_COLUMN_5 = PAGES.slice(3); // Maintenance, Agents, Directory, Capabilities, SystemDiagram

const HOOKS_COLUMN_2 = HOOKS.slice(0, 4); // directory, agents, capabilities, analytics
const HOOKS_COLUMN_4 = HOOKS.slice(4); // maintenance, alone

function FrontendTree({ onGeometryChange }) {
  const { contentRef, registerBox } = useTreeGeometry(onGeometryChange);

  return (
    <div ref={contentRef} className="sysdiag-frontend-tree">
      <div className="sysdiag-frontend-label">REACT (frontend root)</div>

      <div ref={registerBox("app")} className="sysdiag-frontend-app-box">
        <div className="sysdiag-frontend-app-title">App.jsx</div>

        <div className="sysdiag-frontend-app-grid">
          <div className="sysdiag-frontend-app-gap" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />

          <PagesFlank pages={PAGES_COLUMN_1} registerBox={registerBox} />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <PagesFlank pages={PAGES_COLUMN_3} registerBox={registerBox} />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <PagesFlank pages={PAGES_COLUMN_5} registerBox={registerBox} />

          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <HooksRow hooks={HOOKS_COLUMN_2} registerBox={registerBox} />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <HooksRow hooks={HOOKS_COLUMN_4} registerBox={registerBox} />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />

          <div className="sysdiag-frontend-app-bottom-gap" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
          <div className="sysdiag-frontend-gap-cell" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export default FrontendTree;
