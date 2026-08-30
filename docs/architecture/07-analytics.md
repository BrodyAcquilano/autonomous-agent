# Analytics

## Purpose

Analytics measures what actually happened across the system: project execution, agent
performance, routing decisions, and — once the Organizational Brain exists
(`03-agent-organization.md`) — the delegated-call graph itself. It has two distinct consumers
that must be kept separate:

| | Frontend (raw analytics) | Analyst Agent (generated reports) |
|---|---|---|
| Answers | "Show me the data, let me filter/inspect it" | "What happened? What patterns matter? Where did the system struggle?" |
| Form | Live dashboards, charts, filters | Narrative reports with findings and recommendations |

Both read from the same underlying event data. The user should never have to manually read
charts and then explain them to an AI — that synthesis is the Analyst Agent's job.

## Initial (v1) scope

The full event/reporting system below is the target; its first implementation can be limited to
reading basic event records and calculating a small set of simple metrics or summaries, without
yet feeding the organizational-governance loop (`08-organizational-governance.md`) in a
sophisticated way. It grows into the fuller system described here over time, per the
staged-capability principle in `00-overview.md`.

## Event-driven design

The runtime kernel (`03-agent-organization.md`) emits an event at every meaningful transition:
project/feature/task lifecycle changes, agent invocations, delegated calls, tool calls, routing
decisions, QC verdicts, commits, Maintenance actions. Each event conceptually carries
correlation IDs (project/feature/task/attempt/call), the transition type, the agent role
involved, and — where applicable — routing details, status, latency, and token/cost figures. Not
every field is present on every event.

## Categories

- **Workflow** — feature/task counts, retries, re-plans, completion time
- **Agent performance** — latency, token use, failures, retries, acceptance rate
- **Routing** — model/API/tool usage, route changes
- **Quality** — QC approval rate, rejection reasons, attempts per task
- **Cost** — tokens and cost by feature, agent, and model
- **Files** — files created/updated, artifact types
- **Maintenance** — findings, tickets, updates, deletions, reverts
- **Organizational / call-graph** — call-chain length, recovery-loop length, edge usage,
  bottleneck agents (once `03-agent-organization.md` is active)

## Relationship to governance

Analytics does not participate in the execution feedback loop (`02-project-workflow.md`) or
decide organizational structure (`08-organizational-governance.md`) — it feeds evidence into
those processes (particularly HR and the CEO) without exercising authority itself.

## Current repo state vs. target architecture

A narrow, working slice of this exists today, scoped entirely to the Router's and Worker's own
processes — the full event taxonomy above (workflow, quality, files, organizational/call-graph
categories) is still target architecture. `Pages/Analytics/Analytics.jsx` is no longer a
placeholder stub — it is a real, read-only logs page (mirroring the Maintenance page's own logs
view) that lists every agent's `analytics.*` entries generically, filterable by agent, with a
delete action that cascades into any maintenance ticket/log that references the deleted run (see
`06-maintenance.md`) — but it still has no charts, no widgets, and no narrative reports; those
remain target architecture until the Analyst is built up further.

What's real on the data side: a dedicated `analytics` database (isolated from `autonomous` and
`maintenance` on purpose — an Analyst or Maintenance agent should never be able to interfere with
each other or with capabilities-brain data) with two collections, kept deliberately separate so
routing overhead and actual task-execution cost can be measured independently:

- **`router`** — the **server itself** (not any agent) deterministically appends one entry per
  completed Router stage (the stage's parsed decision, token usage for that stage's call, and
  which model/API/tools/capabilities were selected) to that run's document as the Router
  progresses, plus one entry per Maintenance error-recovery consult (its outcome — retry or
  abandon — see `06-maintenance.md`) when the Router reports an error at a stage.
- **`worker`** — the server logs one document per Temp Worker execution (which model/API it
  actually called, the request fields used, token usage, success/failure), referencing the Router
  run that produced the route it executed (see `02-project-workflow.md`, `03-agent-organization.md`).

The Analyst agent never writes to either — it only ever reads them back. A real Analyst agent
(`agents.analyst` in MongoDB, named "Analyst" rather than "Analytics" to distinguish the agent
from the database/discipline it works in, and given `web_search` so it can look up current Azure
OpenAI/Foundry pricing when it wants to reason about actual dollar cost) is called after each
Router stage, **read-only**, and returns a verdict: continue or stop the run, and independently,
whether to log a concern for the Maintenance agent to investigate later — it can flag one without
stopping, or stop without logging one. It does not currently review Worker executions, only
Router stages, and — unlike the Router, whose own errors always go through Maintenance's live
consult immediately (`06-maintenance.md`) — anything the Analyst flags sits in the async
incident-log queue until Maintenance gets to it via a focused request or a general sweep. The
Analyst's own prompt is explicit that a stage's high *input* token usage is normal and expected
(the Router is deliberately given full reference documents to decide well in one pass) and that
only disproportionate *output* token usage is worth flagging, since output tokens are the more
expensive resource on Azure OpenAI pricing. This is the "Agent performance"/"Cost" categories
above in miniature (per-stage token usage, decision consistency), not the full cross-agent,
cross-project system described in this document — there is no report generation, no chart/widget
dashboard, and no visibility across more than one run at a time yet.

**Open question on invocation model.** Calling the Analyst synchronously, inline, after every
single Router stage (as it works today) is suspected of being the wrong long-term shape for this
role — it makes the Analyst part of the Router's own critical path rather than an independent
process, and every run pays its token cost whether or not anything is actually wrong. The
likelier target shape is one of: the Analyst running on its own separate loop/schedule against
already-written `analytics.router`/`analytics.worker` data rather than being called synchronously
mid-run; or the Router pausing and calling out to it only when a specific signal fires (e.g. token
usage crossing a threshold) rather than after every stage unconditionally. This has not been
decided or implemented — see `decisions/open-decisions.md`. The Router and Temp Worker are the
priority to get right first; the current inline-per-stage Analyst wiring should not be taken as
the intended final design.
