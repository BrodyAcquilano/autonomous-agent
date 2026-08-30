# Maintenance

## Purpose

The Maintenance Agent keeps the **Capabilities Brain's** infrastructure knowledge current and
healthy: models, APIs, providers, deployments, capabilities, and their relationship documents.
It does not manage organizational design (that is HR — see `08-organizational-governance.md`)
and does not manage skills content (`04-skills.md`), beyond flagging when a skill references
something Maintenance has deprecated.

## Initial (v1) scope

The mature Maintenance role described below is the target; its first implementation can be much
smaller: running on a timer/cron, inspecting a small set of configured records, checking
configured resources against expectations, applying only already-approved maintenance policies,
and creating tickets. It does not need sophisticated research or fully generalized
backup/rollback machinery on day one — capability grows over time, per the staged-capability
principle in `00-overview.md`.

## Resolved default policy

For modifications or removals of **existing** configuration or brain records, Maintenance
defaults to **Automatic With Rollback**:

1. snapshot/back up the affected state
2. apply the update, deprecation, or removal
3. create a Maintenance review ticket describing what changed and why
4. notify the human when appropriate
5. retain the ability to restore the previous state if the change is rejected

Example: Maintenance determines that an API/model relationship is obsolete, backs it up,
deprecates it, and reports the change afterward — it does not need to wait for approval to make
that specific class of change, because it is reversible and bounded to existing, already-active
configuration.

**Adding new external capability is different and always requires human approval first.**
Maintenance cannot independently create or acquire:

- new API credentials
- new provider accounts
- new paid services
- new Microsoft Foundry deployments
- new external permissions
- secret values
- any other capability expansion requiring human authority

For these, Maintenance's role is limited to identifying the need, drafting what would be
required (entity docs, relationship docs, configuration requirements), and creating a request for
Brody to configure and approve. This mirrors the human-authority principle in `00-overview.md`.

## Scope

- Models, APIs, providers, deployments, capabilities
- Relationship documents in the Capabilities Brain
- Detecting deprecated/broken routes and researching alternatives (including acting as an
  infrastructure researcher when called by another agent — e.g. Quality Control, per
  `02-project-workflow.md` and `03-agent-organization.md` — after a route repeatedly fails)

Out of scope: organizational roles/topology (HR/CEO), skill content quality, project source code.

## Tickets and backups

Every meaningful Maintenance action or proposal produces a ticket recording: what was found, why
it matters, evidence, affected entities/files/records, the before/after change, backup
reference, and whether human approval is required. Backups are immutable during their retention
period and must restore both the affected files and any corresponding database state together,
so the two never fall out of sync.

Email/notification is an alert channel only — it links back to the ticket, but the review
interface (a future Maintenance page, per `09-implementation-roadmap.md`) remains the
authoritative place decisions are actually recorded.

## Current repo state vs. target architecture

**No Maintenance agent exists yet — this document's Maintenance Agent, default policy, and
backup/rollback workflow all remain target architecture.** What does exist is the ticket itself,
and — new since the Router/Worker split matured — a working restart mechanism built on top of it.

Every ticket is written **twice**, deliberately, to the `maintenance` database (separate from
`autonomous` and `analytics`, per the isolation principle in `07-analytics.md`):

1. Into **one collection per agent, named after whichever agent's own judgment produced the
   ticket** — `maintenance.router` for the Router's own decisions, `maintenance.analyst` for ones
   the Analyst agent flags during its stage review. This is keyed by *whose decision it was*, not
   by which code physically writes it: the Analyst agent has no database access of its own, so the
   Router calls the write on its behalf, but the ticket still lands in `maintenance.analyst`. This
   collection is a permanent, append-only log — its documents never change after being written.
2. Into one shared `maintenance.tickets` collection — the **active-tickets queue** — using the
   *same* `_id` as the per-agent copy, so the two can always be cross-referenced. This is what the
   Maintenance page (see below) lists from, and what the restart mechanism below reads by ticket id
   alone, without needing to already know which per-agent collection produced it.

A ticket has `type` (`error` — the request can't be fulfilled as asked — or `request` — a genuine
configuration gap), `message`, `details`, `stage`, `task`, `context`, a `state` object (see below),
and `status`. Per-agent log copies keep whatever `status` they were created with forever, by
design, since they are a permanent record and are never mutated after being written. The
`maintenance.tickets` copy, by contrast, is a live queue: it starts as `"new"`, a human can move it
to `"reviewed"` (acknowledged, but no decision made yet — it stays in the queue), and it is removed
from the queue entirely — not just flagged — by whichever of the two terminal actions actually
resolves it: **ignoring** it (a human decided no action is needed; the per-agent log entry is
untouched) or a **restart** consuming it (see below). There is no third, general-purpose "just
delete this ticket" action distinct from those two — removal is always the specific, named
consequence of one of them. A future Maintenance or Worker agent filing its own tickets would get
its own same-named per-agent collection, mirrored into the same shared `maintenance.tickets` queue.

**Restart/resume.** `state` holds exactly what a restart needs to pick the run back up: the
original `task` and `controlPanelSettings`, the Router run's `runId` (so analytics keeps
appending to the same run document instead of starting a new one), the `stage` the run was at
when it was blocked (`1`–`5`, or `"executing"` for a Temp Worker execution failure), and whichever
route ids were already resolved at that point (`modelId`, `apiId`, `toolIds`,
`toolConfigurations`, and — for an execution-stage failure — the fully assembled
`finalRequestFields`). Deliberately, `state` stores **ids and primitive values only, never full
documents** — restarting a run always re-fetches the corresponding Model/API/Tool/Capability
documents fresh by id (`getModelById`/`getApiById`/`getToolById`/`getCapabilityById`) rather than
trusting anything that might have gone stale between when the ticket was filed and when a human
acts on it. A route/API/tool that was deleted or changed in a way that breaks the resume (e.g. the
referenced id no longer exists) surfaces as a fresh maintenance ticket rather than silently
proceeding on bad data.

A restart is just a normal call to the same request-service route
(`POST /api/request-service/request`, `server/Routes/InternalOperations/RequestService.js`) with a
`resumeTicketId` instead of fresh task text. `runRouter()`
(`server/Services/Router/RouterAgent.js`) loads the ticket's `state`, immediately **deletes** the
`maintenance.tickets` copy (a second failure during the resumed run files its own new ticket rather
than reusing this one — the per-agent log entry is untouched either way), and then re-enters its
own stage sequence — every stage whose id was already resolved is skipped and rehydrated from
fresh data instead of re-run, and the Router's own AI reasoning only runs again from whichever
stage was actually in progress onward. An execution-stage ticket (the Temp Worker itself failed,
not the Router) skips every Router stage entirely and goes straight back to the Worker with the
previously assembled request replayed unchanged against the freshly re-fetched model/API — see
`03-agent-organization.md` for how this fits into the Router/Worker split.

**System status is shared across pages, not just a Console concept.** The frontend's `systemStatus`
(`"ready"`/`"busy"`/`"error"`) lives in `Runtime.jsx` and is set to `"busy"` by *either* a Console
submission or a Maintenance restart, and both surfaces respect it: the Console's command shell
locks its input/buttons while busy regardless of who made it busy, and the Maintenance page's
ticket rows and Restart button lock the same way — a ticket can't be opened to trigger a second
restart while one is already running, from either origin. `App.jsx` also reacts centrally to the
transition *into* `"error"` (from a Console response error, a Router-blocked ticket, or a
Maintenance restart failing again) by reloading the tickets list once, rather than duplicating that
reload call at every place that can produce an error.

Because there is still no Maintenance agent to route tickets to, filing one **bypasses any agent
entirely** — but there is now a real, working human review surface for it: the Maintenance page
(`src/Pages/Maintenance/`).

**The Maintenance page.** Two views over the same underlying data, toggled from a left-hand filter
panel that also holds the type/status filters (tickets view) or a single-agent filter (logs view):

- **Tickets** — every document currently in `maintenance.tickets`, filterable by `type`
  (`error`/`request`) and `status` (`new`/`reviewed`), rendered as a color-coded terminal-style row
  list (red for `error`, amber for `request`). Selecting a row opens a modal showing the full
  ticket — message, details, task, stage, and the raw `state` object — with three actions: **Mark
  Reviewed** (`PATCH /api/maintenance/tickets/:id`, stays in the queue with `status: "reviewed"`),
  **Ignore** (`DELETE /api/maintenance/tickets/:id`, removed from the queue, per-agent log
  untouched), and **Restart Process** (calls the normal request-service route with this ticket's id
  as `resumeTicketId`, per the restart mechanics above).
- **Logs** — every agent's own permanent history, filtered to one agent at a time (or all of them).
  Loaded via one generic route, `GET /api/maintenance/logs/:agentName`, called once per agent
  currently in the `agents` collection — an agent whose collection has never been written to (e.g.
  `worker`, which never files its own tickets) simply comes back empty rather than erroring, so no
  special-casing is needed as new agents are added. A log entry can be deleted outright
  (`DELETE /api/maintenance/logs/:agentName/:id`) since, unlike a ticket, there is no queue
  semantics to preserve — it is just history.

The page also shows its own `systemStatus` readout in its header (`StatusIndicator` — the same
green/amber/red light-and-label concept as the Console's `LightPanel`, but a separate, simpler,
non-draggable component, since it just needs a fixed spot in a page header rather than a floating
widget on a pannable viewport).

There is still no triage, no automatic resolution beyond the restart mechanism above, and no
backup/rollback mechanism of any kind — every ticket is reviewed and acted on by a human, one at a
time, through this page.
