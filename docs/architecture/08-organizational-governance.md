# Organizational Governance

## Purpose

This document describes the layer that manages **the agent organization itself** — what roles
exist, what each should know, and how they are connected — as opposed to running any one
project. It sits above `03-agent-organization.md` (the live, authoritative directory) and is the
long-term, automated replacement for the temporary bootstrap team described in `README.md`.

## Initial (v1) scope

The mature roles described below are the target. HR's first implementation can be limited to
researching possible agent roles and creating basic Job Board proposals, rather than the full
internal-evidence-driven benchmarking described below. The CEO's first implementation can be
limited to reading organizational information and reviewing proposals to make advisory
recommendations — an early, minimal instance of the Advisory-mode starting point described
below, not its fuller decision-making form. Both mature over time, per the staged-capability
principle in `00-overview.md`.

## Roles

### HR / Organization Research Agent

Not a human-resources chatbot — an organization researcher. It studies how the live agent
company actually behaves (call-graph analytics, bottlenecks, repeated escalations, unused
roles), researches external multi-agent architecture patterns, and curates the Job Board. HR can
propose and catalog candidate designs; it does **not** activate privileges or modify the live
Organizational Directory itself.

### Agent Job Board / Design Catalog

A versioned, advisory catalog of reusable candidate designs — explicitly **not** a marketplace
and **not** a token/idle-capacity board. A Job Board entry can describe a candidate agent role
(purpose, inputs/outputs, recommended tools/skills/model needs, typical callers/callees,
provenance and evidence), a reusable tool/skill bundle, an input/output contract, a
feedback-loop pattern, or a full organization topology template.

This is a different question from the Skills-based recruitment search described in
`04-skills.md`: a Job Board entry proposes a **new** role that doesn't exist yet (HR designs it,
the CEO instantiates it); a Skills search looks for an **existing, standing** agent (already in
`agents`) whose listed skills already match a task at hand. Both are expected to route through
HR/the CEO rather than the Router, and neither exists in the runtime yet.

Lifecycle: `draft → researched → candidate → recommended → instantiated`, with `rejected` and
`deprecated` as terminal states. Every meaningful entry records its provenance (internal
analytics, internal incident, maintenance finding, external research, or a prior successful
project) and supporting evidence, so the CEO reasons from evidence rather than free-form
redesign.

### CEO Agent

Compares the live Organizational Directory against the Job Board and analytics/HR/Maintenance
findings, and proposes or applies organizational change: instantiating a candidate role,
specializing or merging responsibilities, retiring an obsolete role, adding/removing call
edges, or adopting a topology pattern. "Hiring" means taking a Job Board template and
instantiating it as a live agent profile plus directory edges — not acquiring an external
worker.

```
JOB BOARD TEMPLATE → CEO selects + customizes → STAGED AGENT PROFILE
  → tools/skills/permissions verified → DIRECTORY EDGES + REQUEST TYPES
  → approval if required → ACTIVE AGENT
```

A CEO proposal should produce a concrete graph diff (agents/edges added, removed, unchanged) for
review, not just a prose recommendation.

## Resolved decision: CEO autonomy starts Advisory

```
Advisory → Approval-Gated → Bounded Autonomous
```

The CEO begins in **Advisory** mode: it can analyze the organization and produce proposals, but
cannot apply changes. This is also simply appropriate to where the project is — there is little
for the CEO to manage until the organization itself has been built (see
`09-implementation-roadmap.md`). Progression to Approval-Gated and eventually Bounded Autonomous
happens deliberately, as trust is established, and always subject to the risk classification
below.

## Risk classification

- **Low-risk** (may auto-apply under policy once past Advisory mode): role description
  improvements, benchmark notes, Job Board documentation updates, deprecating stale candidates.
- **Approval-gated**: adding an active agent role, adding/removing call edges, changing
  retry/escalation limits, changing default model requirements, substantial responsibility
  changes.
- **Always high-impact / always human**: new external-service access, new write permissions,
  new credentials or paid providers, production deployment or user-data mutation, or anything
  that would let an agent authorize its own privilege expansion.

## HR vs. Analytics vs. Maintenance

These three roles are easy to conflate and must stay distinct:

| | Analytics | HR | Maintenance |
|---|---|---|---|
| Question | What happened? | What organizational design might improve it? | Is the infrastructure still healthy? |
| Domain | Project/agent behavior metrics | Roles, responsibilities, call topology | Models, APIs, providers, deployments |
| Output | Cost/quality/latency/retry metrics | Candidate roles, topology patterns, benchmarks | Tickets, updates, deprecations |
| Authority | None — reports only | Curates Job Board only — does not activate privileges | May auto-apply reversible changes to existing config (`06-maintenance.md`) |

## Governance loop

```
Live Organization → Analytics + Call Graph → HR Research (+ external research)
  → Job Board → CEO → Organization Change Proposal → (approval / bounded policy)
  → Organizational Directory → Live Organization
```

This gives the organization a way to improve based on measured evidence while the live directory
remains explicit, versioned, and auditable (`05-ontology-versioning.md`).

## Relationship to the bootstrap team

Today, Brody, ChatGPT, and Claude Code collectively perform the role this document describes:
observing the repository and its constraints, researching and comparing designs, and deciding
what should change. The CEO/HR/Maintenance/Analytics roles described here are the eventual
automated version of that same function, not a separate concern — this document is effectively a
specification for the team's own job, written so it can eventually be handed off.

## Current repo state vs. target architecture

None of CEO, HR, or the Job Board exist today. This is target architecture, and per the roadmap
(`09-implementation-roadmap.md`) is one of the first agent roles built — but only after
foundational operational knowledge (Capabilities Brain, directory, request types) has been
populated, and initially in Advisory mode only. That precondition is now partially met: the
Capabilities Brain and a first Organizational Brain slice (`agents`, `directory`, request types for
the `router` and `analyst` agents) exist per `01-capabilities-brain.md` and
`03-agent-organization.md` — but this does not mean CEO/HR are next. A narrow Analyst agent
exists (`07-analytics.md`), built out of the Router's own need for a safety monitor rather than as
part of this governance layer; see `decisions/open-decisions.md` item 9.
