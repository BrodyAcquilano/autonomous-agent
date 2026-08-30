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

**A first, narrow Maintenance agent now exists and is wired into the runtime** — the mature role,
default policy, and backup/rollback workflow described above remain the target; what exists today
is a real bootstrap of it (per the "Initial (v1) scope" section above), with one important
authority already in place: **only the Maintenance agent may ever file a ticket.** The Router, the
Analyst, and the Temp Worker never do — they only ever *report* a problem, and it is always
Maintenance's own decision, taken after investigating, whether that becomes a ticket for a human
and what it recommends. This split exists specifically so each agent's own prompt can stay
narrowly focused on its own job (routing, reviewing, or executing) without also carrying
error-handling/escalation policy that belongs to a specialist.

A second authority now exists alongside the first, deliberately much more constrained: **the
Maintenance agent can also write new documents into the Capabilities Brain itself** —
`autonomous.models`/`apis`/`tools`/`capabilities` — but only in one narrow, deterministic
circumstance (a human-approved ticket restart, see "Applying an approved patch" below), never on
its own initiative, and never an edit or delete of anything that already exists.

### Logs vs. tickets

Two distinct kinds of document live in the `maintenance` database (separate from `autonomous` and
`analytics`, per the isolation principle in `07-analytics.md`), and the relationship between them
is deliberately one-directional:

- **A log** is a permanent record of one agent's own problem, written into that agent's own
  collection (`maintenance.router`, `maintenance.analyst`, `maintenance.worker`) with
  `status: "unprocessed"` and `ticketId: null`. It exists whether or not anything is ever done
  about it.
- **A ticket** is Maintenance's own decision that a log (or a live situation) is worth a human's
  attention, together with Maintenance's actual recommendation. Every ticket is written **twice**:
  once into `maintenance.maintenance` (Maintenance's own permanent record of every ticket it has
  ever filed) and once more, under the same `_id`, into the shared `maintenance.tickets`
  **active-tickets queue** that the Maintenance page lists from. Filing a ticket from a log also
  marks that log `status: "processed"` and stamps its `ticketId`, linking the two.

That link is what makes deleting either one behave asymmetrically, by design: **deleting a log
deletes its linked ticket with it** (both the active-queue copy and the permanent
`maintenance.maintenance` copy), because a ticket whose originating log is gone has nothing left
to point back to — but **deleting a ticket (via Ignore, or a restart consuming it) never touches
the log it came from.** A ticket's `loggedBy` field always names whichever agent's log it was
escalated from (`router`, `analyst`, or `maintenance` itself for something it found on its own),
independent of the fact that Maintenance is always the one submitting it — this is what the
Maintenance page actually filters by, since "who did the paperwork" is always the same agent and
isn't useful to filter on.

### The three ways Maintenance is invoked

1. **A live error-recovery consult** — a Router run in progress reported an error (see below) and
   the server needs an answer before deciding whether to retry the run or end it. Time-sensitive,
   and scoped to only the reference material the Router itself had loaded for that one stage, not
   a full Capabilities Brain scan.
2. **A focused human request** — free text submitted from the Maintenance portal's own command
   shell (`POST /api/request-maintenance/request`, `{ focus }`), e.g. "is gpt-5.6-terra still the
   latest version?".
3. **A general sweep** — with no focus text and nothing in the async incident-log queue, one
   broad, undirected audit pass over the whole Capabilities Brain. A disabled-by-default cron
   scaffold (`server/Runtime/MaintenanceCron.js`, gated on `MAINTENANCE_CRON_ENABLED`) exists to
   put this on a timer later; it is off by default because a locally-run dev server restarting
   constantly is not a good environment for a recurring background job yet.

The async incident-log queue itself (mode 3's other input, when it isn't empty) currently only
ever contains Analyst-sourced logs — a Router error is never queued for a later sweep, because it
is always handled immediately by mode 1 instead (see below).

### Live error recovery: how a Router run actually ends now

The Router's own output at any stage is either a normal decision, or `{ type: "error", errorType,
errorMessage, errorDetails }` when it genuinely cannot decide (see `03-agent-organization.md` for
why the Router itself knows nothing about tickets, logs, or Maintenance by name). Reporting an
error does not end the run by itself — the server (`runRouter()` in
`server/Services/Router/RouterAgent.js`) always hands exactly what the Router saw to Maintenance
for a live consult before anything is decided:

1. **The Router's error is always logged first**, into `maintenance.router`, regardless of what
   happens next — this is the one thing that still happens unconditionally, matching the original
   "every problem gets a permanent record" principle even though tickets are no longer filed
   directly.
2. Maintenance investigates using only the reference documents the Router had already loaded for
   that stage (e.g. just the model catalog for a Stage 1 error; the chosen model plus its API
   candidates for a Stage 2 error), and decides one of two things:
   - **There is a way forward** (`actionType: "self_fixed"` or `"none"`) — the server retries that
     exact same stage once, with Maintenance's own `instructions` included as extra context (a
     `MAINTENANCE FIX FOR THIS STAGE` input section, distinct from the whole-task
     `MAINTENANCE GUIDANCE` a ticket restart supplies — see below).
   - **Nothing can be done right now** — Maintenance files a ticket (`loggedBy: "router"`, linked
     to the log from step 1) and the run ends there.
3. **The one retry is bounded, not optional.** If it fails again, Maintenance is consulted once
   more, but is told plainly this is the second failure and must conclude the task cannot proceed
   — the server enforces this regardless of what comes back, so a run can never loop indefinitely
   between the Router and Maintenance. This second failure is treated as **two separate problems,
   not one**: the original ticket (`loggedBy: "router"`) is filed as usual, *and* a second log is
   written to `maintenance.maintenance` describing that Maintenance's own suggested fix also
   didn't work, which becomes its own second ticket (`loggedBy: "maintenance"`). The intent is
   that a human reviewing these sees two distinct things to fix — the Router's original problem,
   and a separate failure in Maintenance's own recommendation — not one conflated entry.

**The Temp Worker goes through the same consult, attributed to itself.** When the Worker's actual
execution of a fully-resolved route fails (the real Azure call rejected it — e.g. the Capabilities
Brain claimed a tool was available and it wasn't), that is the Worker's own failure, not the
Router's — the Router picked a reasonable route based on what the brain claimed to support. The
failure is logged into `maintenance.worker` (not `maintenance.router`) and consulted the same way,
but with no retry step at all: there is no textual fix Maintenance could hand the Worker to try
again with, so this always ends in a ticket (`loggedBy: "worker"`). A couple of Router-side
protocol errors (invalid JSON, a capability chosen for the wrong tool) go through the same
consult mechanism too, also without a retry step, since there is nothing meaningful to retry
automatically in those cases either.

The wire response for an ended run is `{ status: "blocked", runId, tickets: [...] }` — an array,
since abandonment can produce one or two tickets — consumed identically by the Console's command
shell and the Maintenance page's restart handler.

### Restart is a literal fresh run, not a resume

Restarting a ticket no longer skips ahead to wherever the run left off. `state` on a ticket now
holds only `runId`, `task`, and `controlPanelSettings` — enough to run the task again from
scratch — because a restart is a full re-run of the Router from Stage 1, not a rehydration of
previously-resolved ids. What is fed back in is Maintenance's own recommendation
(`recommendedAction: { actionType, summary, instructions }`, carried on the ticket), turned into a
`MAINTENANCE GUIDANCE` input section on every stage of the fresh run — a colleague's advice on what
to try differently, not a hard constraint the Router must follow. A restart is a normal call to
the same request-service route (`POST /api/request-service/request`,
`server/Routes/InternalOperations/RequestService.js`) with a `ticketId` instead of fresh task
text; the ticket is deleted from the active queue immediately upon being read, and a second
failure produces its own new ticket through the same error-recovery flow described above rather
than reusing it.

### Applying an approved patch

When a ticket's `recommendedAction.actionType` is `add_model`/`add_api`/`add_tool`/
`add_capability`, restarting it does one more thing first, silently, before the task itself runs
again: it triggers `applyCapabilitiesBrainPatch()`
(`server/Services/Maintenance/MaintenanceAgent.js`), which writes the new Capabilities Brain
documents that ticket described. The human clicking **Restart Process** *is* the approval — there
is no separate confirmation step, and the button is not renamed, because that is still exactly
what it does; the patch is a prerequisite, not a separate user-facing action.

The patch runs one layer at a time — `models` → `apis` → `tools` → `capabilities` — starting at
whichever layer the ticket's own `actionType` names and resolving the parent model/API to attach
to from the ticket's own `context` (the Router's `routeSoFar` at the moment it originally failed),
so Maintenance never has to guess which model an "add a tool" request is about. Each layer is one
separate, narrowly-scoped AI call given only the ticket's own `summary`/`instructions` (written by
Maintenance's own earlier self when the ticket was first filed), the parent document already
resolved, and a handful of existing sibling documents at that same layer as a structural/stylistic
reference — never the whole brain at once. A layer can return zero new documents (stopping the
cascade) or say `continueToNextLayer: false` itself once nothing further is needed — a simple new
model with a working direct API and no tools of its own stops after two calls, not four.

Every document this writes is inserted through `insertModel`/`insertApi`/`insertTool`
(`server/Services/MongoDB/Models.js`/`Apis.js`/`Tools.js`, new this round) or `insertCapability`
(`server/Services/MongoDB/Capabilities.js`, already existed for the Router's own suggestions) —
immediately usable (`status: "SUPPORTED"`, so the very next Router stage can select it) but tagged
`origin: "maintenance-authored"` and `reviewStatus: "pending"`, the same convention already used
for a Router-suggested capability, distinguishing *who* authored a document from a human without
that distinction gating anything. See `01-capabilities-brain.md` for this in the context of the
brain itself.

**What this still cannot do.** A genuinely new model needs a human to configure the real Azure
deployment, add its `.env` variable, and add a matching `case` to `getAzureConfig()`
(`server/Services/Azure/OpenAIResponses.js`) — none of that is a database document, so the patch
cannot do it, and Maintenance's own `instructions` (written at ticket-filing time) are expected to
say so explicitly. A patch failure is never fatal to the restart itself — if nothing actually got
added, the Router simply hits the same error again and goes through the normal live-consult
recovery above, so this fails safely rather than blocking the task.

**System status is shared across pages, not just a Console concept.** The frontend's `systemStatus`
(`"ready"`/`"busy"`/`"error"`) lives in `Runtime.jsx` and is set to `"busy"` by *either* a Console
submission or a Maintenance restart, and both surfaces respect it: the Console's command shell
locks its input/buttons while busy regardless of who made it busy, and the Maintenance page's
ticket rows and Restart button lock the same way. `App.jsx` also reacts centrally to the transition
*into* `"error"` by reloading the tickets list once, rather than duplicating that reload call at
every place that can produce an error.

### The Maintenance page

Two views over the same underlying data, toggled from a left-hand filter panel:

- **Tickets** — every document currently in `maintenance.tickets`, filterable by `type`
  (`error`/`request`), `status` (`new`/`reviewed`), and now also **`loggedBy`** (which agent's
  problem this was originally), rendered as a color-coded terminal-style row list. Selecting a row
  opens a modal showing message, details, task, stage, Maintenance's `recommendedAction`, and the
  restart `state`, with three actions: **Mark Reviewed** (`PATCH /api/maintenance/tickets/:id`),
  **Ignore** (`DELETE /api/maintenance/tickets/:id`, the log it came from is untouched), and
  **Restart Process** (calls the request-service route with this ticket's id, per above).
- **Logs** — every agent's own permanent history, filtered to one agent at a time (or all of
  them), loaded via `GET /api/maintenance/logs/:agentName`. Deleting a log
  (`DELETE /api/maintenance/logs/:agentName/:id`) cascades to delete its linked ticket everywhere,
  per the one-directional relationship described above; the response reports the cascaded ticket
  id so the frontend can prune it from local state without a full reload.

The bottom half of the filter panel — previously empty — now also holds a **Request Maintenance**
control: a free-text box and submit button that calls invocation mode 2 above directly from the
portal, so requesting a normal task (Console) and requesting Maintenance's investigation (this
page) are two clearly separate surfaces rather than one shared control. The page shows its own
`systemStatus` readout in its header (`StatusIndicator`, the same concept as the Console's
`LightPanel` but fixed and non-draggable).

There is still no triage or backup/rollback mechanism beyond what's described above — every ticket
is reviewed and acted on by a human, one at a time, through this page.
