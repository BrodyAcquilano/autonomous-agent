# Open Decisions

This document tracks implementation choices that are **intentionally not yet decided**. Do not
resolve these silently in code or in another document — bring them back to Brody/ChatGPT/Claude
Code discussion when they become blocking, and update this file (moving resolved items into the
relevant canonical document, with a note of what was decided and why) once they are.

Several items from earlier architecture review are now resolved and are documented in place
rather than listed here: MongoDB as the persistent brain (with Markdown content stored directly
as a `contentMarkdown` string field alongside structural metadata — no Git-as-source/Mongo-as-
index dual system, no object storage for ordinary brain content), task-not-a-tensor-dimension,
Execution/Organizational Brain separation, delegated calling as the target, the Agent Skills
standard, ontology-as-versioned-data (with only minimal version-awareness required initially —
see `05-ontology-versioning.md`), the Maintenance default policy, CEO autonomy progression, and
Vector Search being optional rather than a prerequisite for the first implementation. What
remains open:

## 1. Concrete MongoDB collection schemas

**Further resolved.** Beyond the Capabilities Brain slice (`models`, `apis`, `tools`, `capabilities`,
`platforms` — see `01-capabilities-brain.md`), a first Organizational Brain schema now also exists:
`agents` (profile-card prompts, now four: `router`, `analyst`, `maintenance`, `worker`) and
`directory` (agent/contact/request-type documents — see `03-agent-organization.md`), plus
`analytics.router`/`analytics.worker` (per-run process trace with per-stage token usage, and
per-execution log). In `maintenance`, the schema now distinguishes two kinds of document rather
than one: a per-originating-agent **log** (`maintenance.router`, `maintenance.analyst`,
`maintenance.worker`) that is just a permanent record of a reported problem, and a **ticket** —
only ever written by the
Maintenance agent's own decision, into `maintenance.maintenance` and mirrored under the same `_id`
into a shared `maintenance.tickets` active-tickets queue (status `"new"`/`"reviewed"`, removed on
ignore or restart — reviewed through a real Maintenance page). A ticket's `state` now carries only
`runId`, `task`, and `controlPanelSettings` — a restart is a literal fresh run from Stage 1, not a
resume of previously-resolved ids — and a `loggedBy` field naming whichever agent's log it was
escalated from, since Maintenance is always the one submitting it. See `07-analytics.md`,
`06-maintenance.md`. What remains undesigned: skills/skill-version schema, ontology-version
records, and — notably — the directory schema above is descriptive data only; a schema for the
call envelope / kernel-enforcement layer that would actually validate an edge before a call
happens has not been designed.

## 2. Migration timing/mechanics for the filesystem `brain/` prototype

MongoDB is the canonical source for operational brain content going forward (resolved) — the
filesystem `brain/` directory is prototype content, not a permanent parallel source of truth.
What remains open is *when and how* the existing `brain/models/*.md` / `brain/apis/**/*.md`
content gets migrated in, and whether the current filesystem-serving routes are replaced outright
or kept briefly during a transition.

## 3. Numeric limits for delegated calling

`03-agent-organization.md` requires call budgets, call-depth limits, and repeated-edge/cycle
limits to exist, but no actual default numbers (max depth, max repeated calls per task, token/
cost budget defaults) have been chosen.

## 4. Initial seed set

**Partially resolved.** The Capabilities Brain is seeded with a deliberately tiny set: 3 models
(`gpt-5.6-terra`, `gpt-5.3-codex`, `gpt-image-2`), 1 platform, 3 model-scoped API documents, 3
tools and 3 capabilities (all currently under `gpt-5.6-terra`'s Responses API route) — enough to
exercise every node of the funnel at least once. The Organizational Brain's first seed set turned
out to be `router`, `analyst`, `maintenance`, and `worker` — not a deliberate answer to "which
roles get seeded first," but a consequence of the Router needing a safety monitor (Analyst) and a
sole ticket-filing authority (Maintenance) to be usable at all (see item 9 below). Which
*additional* roles get seeded next, and in what order, is still open.

## 5. Reconciling the current Console flow with the future Router/Worker path

**Partially resolved.** The Console page now calls a real Router, which hands off to a real,
separate Temp Worker for execution (`02-project-workflow.md`, `03-agent-organization.md`) — so a
Router/Worker split already exists in the runtime, not just in this documentation set. What
remains open is whether *this* Router/Worker pair becomes the entry point the future
Planner/Coordinator/QC roles sit on top of, is replaced outright by a more capable version once
those roles exist, or continues as a separate "quick chat" mode alongside full project execution.

## 6. Human-approval interface mechanics

Every governance document (Maintenance, Ontology Versioning, Organizational Governance)
references "human approval" as a gate, but the actual review/approval UI and workflow has not been
designed in general. **Resolved for Maintenance specifically:** a real Maintenance page
(`src/Pages/Maintenance/`) now lists `maintenance.tickets` (filterable by type/status/`loggedBy`)
and every agent's own permanent log (filterable by agent), can mark a ticket reviewed, ignore it,
or restart the task it came from, and can now also submit a focused request directly to the
Maintenance agent from a control in its own filter panel — see `06-maintenance.md`. What remains
open is the equivalent review/approval surface for Ontology Versioning and Organizational
Governance, and notification mechanics beyond "email is an alert channel," neither of which exist
yet.

## 7. MCP/tool access boundaries per management role

**Partially resolved for the four roles that exist.** The `directory` collection's
`request_types` documents now concretely record this for `router` (read/write on `autonomous`,
plus calls to the `analyst` agent for stage review, the `maintenance` agent for a live
error-recovery consult, and `mongodb-maintenance` to log its own error), `analyst` (read-only on
`analytics`, plus `mongodb-maintenance` to log a concern), `worker` (write on `analytics` for its
own execution log, output to the user, plus the same pair of `maintenance`/`mongodb-maintenance`
contacts as the Router for its own execution failures), and `maintenance` itself — **read/write**
on `autonomous`, not read-only: Capabilities Brain research plus, in one narrow circumstance (an
already human-approved ticket restart), writing new `models`/`apis`/`tools`/`capabilities`
documents — read/write on `mongodb-maintenance` for the incident-log queue and its own tickets,
and — the only agent with this contact — the human-reviewed maintenance portal — see
`03-agent-organization.md`, `06-maintenance.md`. What CEO/HR may access once they exist, and which
external research tools any role may invoke beyond `web_search` (already given to the Router,
Analyst, and Maintenance), remains open.

## 8. Backup/archive retention periods

`06-maintenance.md` and `05-ontology-versioning.md` both require backups/archived versions to be
retained for some period before being eligible for cleanup. No retention policy (e.g. 7/30/90
days) has been chosen.

## 9. First executable slice: lightweight management agent vs. Router/Worker

**Resolved in practice, informally.** Neither pure strategy was followed. A working Router agent
was built (the bottom-up path), but a narrow Analyst agent was built alongside it rather than
after it, because the Router needed a safety monitor to be usable at all — not because the
top-down management-organization sequencing was deliberately resumed. A first, narrow Maintenance
agent followed the same logic: once the Router and Analyst could each report a problem, something
had to be the sole authority that decides what to do about it and files an actual ticket, so
Maintenance was built next, ahead of HR or the CEO, purely because ticket-filing was already a gap
blocking normal use of the Router. No HR or CEO agent exists. Treat this as evidence that the two
strategies aren't strictly exclusive in practice, not as a decision that the top-down sequencing
in `09-implementation-roadmap.md` has been abandoned.

## 10. Analyst invocation model: inline per-stage vs. independent loop/threshold-triggered

The Analyst currently runs synchronously, inline, in the Router's own request path — called after
every one of the Router's 5 stages, on the critical path of every single run (see `07-analytics.md`).
This is suspected of being wrong long-term: candidates being considered instead are (a) the
Analyst running on its own separate schedule/loop, reading already-written `analytics.router`/
`analytics.worker` data after the fact rather than being called mid-run, possibly through its own
control panel to report on prior runs' stats; or (b) the Router only pausing to call it when a
specific signal fires (e.g. token usage crossing a threshold) rather than unconditionally after
every stage. Not decided. Until it is, the Router and Temp Worker are the priority to get correct;
the current inline wiring is what exists today, not a statement of the intended final design.
