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

A narrow, working slice of this exists today, scoped entirely to the Router's own process — the
full event taxonomy above (workflow, quality, files, organizational/call-graph categories) is
still target architecture, and `Pages/Analytics/Analytics.jsx` is still a placeholder stub with no
frontend dashboards or narrative reports of any kind.

What's real: a dedicated `analytics` database (isolated from `autonomous` and `maintenance` on
purpose — an Analyst or future Maintenance agent should never be able to interfere with each
other or with capabilities-brain data) with a `router` collection. The **server itself** — not any
agent — deterministically appends one entry per completed Router stage (the stage's parsed
decision, and which model/API/tools/capabilities were selected) to that run's document as the
Router progresses; the Analyst agent never writes to it. A real Analyst agent
(`agents.analyst` in MongoDB, named "Analyst" rather than "Analytics" to distinguish the agent
from the database/discipline it works in) is then called after each stage, **read-only**, and
returns a
verdict: continue or stop the run, and independently, whether to file a maintenance ticket — it
can flag a concern without stopping, or stop without filing a ticket. This is the "Agent
performance"/"Cost" categories above in miniature (per-stage token usage, decision consistency),
not the full cross-agent, cross-project system described in this document — there is no report
generation, no dashboard, and no visibility across more than one run at a time yet.
