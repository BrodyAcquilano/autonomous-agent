# Analytics

## Purpose

Analytics measures what actually happened across the system: project execution, agent
performance, routing decisions, and — once the Organizational Brain exists
(`03-agent-organization.md`) — the delegated-call graph itself. It has two distinct consumers
that must be kept separate:

| | Frontend (raw analytics) | Analytics Agent (generated reports) |
|---|---|---|
| Answers | "Show me the data, let me filter/inspect it" | "What happened? What patterns matter? Where did the system struggle?" |
| Form | Live dashboards, charts, filters | Narrative reports with findings and recommendations |

Both read from the same underlying event data. The user should never have to manually read
charts and then explain them to an AI — that synthesis is the Analytics Agent's job.

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

No analytics event emission, storage, or reporting exists today; `Pages/Analytics/Analytics.jsx`
is a placeholder stub. This is target architecture. Concrete MongoDB event schema and report
storage are a Phase 3/4 design task (`09-implementation-roadmap.md`) and are not specified here.
