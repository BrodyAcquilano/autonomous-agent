# Architecture Documentation

This directory is the canonical, Git-tracked specification for how this application and its
eventual autonomous organization are designed. It replaces informal historical notes as the
source of truth for architecture.

## What this is — and isn't

- These files are **software architecture specifications**: Markdown, human-readable, meant to
  be read by both developers and Claude Code sessions before making design or implementation
  decisions.
- They are **not** the runtime brain itself. The operational knowledge these documents describe
  (actual model records, actual agent profiles, actual ontology versions, actual maintenance
  tickets, etc.) will live in MongoDB once that phase begins. A document like
  `05-ontology-versioning.md` explains *how ontology versioning works as a process* — it does not
  contain an ontology.
- The filesystem `brain/` directory elsewhere in this repo (`brain/models/*.md`,
  `brain/apis/**/*.md`) is **prototype/reference infrastructure** from the original bottom-up
  build. It is not a competing long-term architecture and is not documented here as one.
- `autonomous-agent-notes/` (if still present in the repo root) is historical exploratory
  material used to derive these documents. It is superseded by this directory and is not itself
  part of the design going forward.

## How these documents relate to the current codebase

The application today (React/Vite frontend, Express backend) is a useful scaffold, not a full
implementation of the architecture described here — but it is no longer a single-shot Azure
OpenAI Responses proxy either. A real, working Router agent now resolves and executes tasks
(`01-execution-brain.md`, `03-agent-organization.md`), backed by a small Analytics agent
(`07-analytics.md`) and maintenance ticketing (`06-maintenance.md`). Most of the rest of what
follows — Coordinator/Planner/Worker-QC, Maintenance/HR/CEO agents, dashboards — still describes
**target architecture** that has not been built yet. Each document calls out current-repo-state
vs. target-architecture explicitly where the distinction matters. See
`09-implementation-roadmap.md` for the sequencing plan and `decisions/open-decisions.md` for what
is intentionally still undecided.

## Reading order

1. `00-overview.md` — system goal, layering, core principles, glossary
2. `01-execution-brain.md` — models/APIs/tools/capabilities and how routing works
3. `02-project-workflow.md` — Coordinator → Planner → Router → Worker → QC
4. `03-agent-organization.md` — the delegated agent-calling directory and runtime kernel
5. `04-skills.md` — procedural knowledge (Agent Skills standard + MongoDB decision graphs)
6. `05-ontology-versioning.md` — how schema/ontology change is governed over time
7. `06-maintenance.md` — keeping execution-brain infrastructure current
8. `07-analytics.md` — telemetry and reporting
9. `08-organizational-governance.md` — HR, the Job Board, and the CEO agent
10. `09-implementation-roadmap.md` — the build sequence and current status
11. `decisions/open-decisions.md` — unresolved choices, tracked explicitly rather than guessed at

## Bootstrap development process

Until the internal management organization (CEO/HR/Maintenance/Analytics) exists, this project
is designed and built by a temporary three-person team: **Brody** (project owner and final human
authority over credentials, external access, and high-impact decisions), **ChatGPT** (used for
architecture discussion, research, and comparing alternatives), and **Claude Code** (the
repository-aware implementation partner: inspects the repo, synthesizes and maintains this
documentation, designs concrete database structures, implements approved designs, and flags real
technical contradictions rather than silently following an inconsistent instruction). Brody and
ChatGPT typically work out architectural direction first and hand Claude Code the resulting
implementation instructions. The eventual CEO agent described in
`08-organizational-governance.md` is a component of the application itself and is a distinct
thing from this temporary bootstrap arrangement.
