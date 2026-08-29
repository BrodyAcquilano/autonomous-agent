# Overview

## System goal

The long-term goal is an autonomous multi-agent system that can take a project request, plan and
execute the work needed to fulfill it, route each task to the right model/API/tool
configuration, verify the result, learn reusable procedures, keep its own operational knowledge
current, and — eventually — research and adjust its own organizational structure under bounded,
auditable human governance.

The system is being built **top-down**: architecture and operational knowledge first, then a
small management organization, then the project-execution organization underneath it. See
`09-implementation-roadmap.md` for why this order was chosen over the original bottom-up plan.

## Layers

The design separates concerns into distinct layers. Each has its own canonical document:

| Layer | Document | Answers |
|---|---|---|
| Execution Brain | `01-execution-brain.md` | What can be executed, and how? |
| Project Workflow | `02-project-workflow.md` | How does one project request become finished work? |
| Agent Organization | `03-agent-organization.md` | Who may call whom, for what, under what limits? |
| Skills | `04-skills.md` | How has the system learned to do specific work? |
| Ontology Versioning | `05-ontology-versioning.md` | How does the schema itself change safely over time? |
| Maintenance | `06-maintenance.md` | Is the operational infrastructure still healthy? |
| Analytics | `07-analytics.md` | What actually happened? |
| Organizational Governance | `08-organizational-governance.md` | Should the organization itself change? |

Two of these are explicitly **separate structural systems that must not be collapsed into one**:

- **Execution Brain** — `Model × API × Tool / Capability` relationships. Answers "how can this
  task be executed?"
- **Organizational Brain** (part of Agent Organization) — `Caller Agent × Callee Agent × Request
  Type` relationships. Answers "who may call whom for what, right now?"

They use the same structural principles (sparse relationship tensors, exact retrieval before
semantic search, explicit support/authorization status) but they model different domains and are
designed, versioned, and queried independently.

## Core principles

These principles recur across every layer and should be treated as standing constraints on any
future design or implementation work in this area:

1. **Structural filter before semantic search.** When a relationship can be explicitly defined
   (which model supports which API, which agent may call which other agent), prefer an exact,
   indexed lookup over semantic/vector search. Semantic search is for narrowing an already-valid
   candidate set, or for genuinely fuzzy contextual knowledge (project history, notes) — it must
   never be the mechanism that grants a routing or calling permission.
2. **Missing knowledge is `unknown`, not `unsupported`.** A relationship that has not been
   documented yet is not the same as one that has been checked and rejected. Both the execution
   brain and the organizational directory must be able to express this distinction.
3. **Progressive loading / context minimization.** Agents and skills should load the smallest
   amount of context needed to make the next decision — metadata before full instructions,
   full instructions before deep reference material — rather than loading an entire knowledge
   base up front. This is a deliberate token- and reliability-control strategy, not just an
   optimization; it recurs in `01-execution-brain.md` (structural narrowing before semantic
   search), `03-agent-organization.md` (local phone books instead of the full directory), and
   `04-skills.md` (metadata → SKILL.md → resources).
4. **Server/runtime kernel as enforcement, agents as logical routers.** Agents decide *what
   should happen next and why*; the kernel decides *whether it is allowed to happen*
   (permissions, budgets, credentials, cycle limits, filesystem/database authority). See
   `03-agent-organization.md`.
5. **Runtime tasks are input, not schema.** Project/task text is open-ended natural language and
   is never required to exist as an indexed structural dimension. The Router translates a task
   into stable capability requirements before entering the Execution Brain. See
   `01-execution-brain.md`.
6. **Ontology is versioned data.** Entity types, relationship types, and directory schemas are
   not permanently hard-coded; they evolve through an explicit, auditable, reversible governance
   process. See `05-ontology-versioning.md`.
7. **Staged autonomy and staged capability.** Every agent capable of delegation, mutation, or
   organizational change starts with the least authority that lets it be useful (advisory, or a
   small set of authorized edges) and gains authority deliberately as the system proves itself.
   This is separate from, and compounds with, staged *capability*: an agent's first version
   should also be functionally minimal (e.g. a cron-driven check-and-ticket loop rather than a
   fully reasoning research agent), maturing in sophistication over time rather than being built
   to its target intelligence on day one. Nothing here assumes broad autonomous authority or
   mature capability on day one.
8. **Human authority over irreversible or external-facing change.** Credentials, paid services,
   new external access, and other high-impact/privilege-expanding actions always require human
   approval, regardless of which agent or automated process identified the need for them.

## Current repo state vs. target architecture

The application currently in this repository is a **scaffold**, not an implementation of the
layers above:

- A React/Vite frontend and Express backend exist and work today, but they implement only a
  single-shot proxy from a Console page to Azure OpenAI's Responses API — there is no Planner,
  Router, Worker, Quality Control, Maintenance, Analytics, HR, or CEO agent anywhere in the
  runtime.
- `server/Runtime/` (`Supervisor`, `Worker`, `State/RunMachine`, `State/createRunState`,
  `Memory/*`) and `server/Services/Files/FileService.js` are empty (0-byte) files left over from
  an earlier bottom-up plan. They do not currently do anything and should not be assumed to
  implement any part of the architecture described here.
- The filesystem `brain/` directory (`brain/models/*.md`, `brain/apis/**/*.md`) is read directly
  by Express routes and served to the frontend. It is prototype/reference content, not the
  target persistent brain — MongoDB is (see `01-execution-brain.md` and
  `05-ontology-versioning.md`).
- Per current direction, this runtime is treated as **paused** while the architecture and
  operational knowledge base are established. Do not refactor it to match this target
  architecture until the roadmap in `09-implementation-roadmap.md` reaches that phase.

## Glossary

- **Execution Brain** — the structural knowledge base of models, APIs, tools, and capabilities,
  and the valid relationships between them.
- **Organizational Brain / Directory** — the structural knowledge base of which agents may call
  which other agents, for which request types, under which conditions.
- **Structural memory** — knowledge stored and retrieved by explicit, indexed relationship,
  because the relationship can be fully defined in advance.
- **Semantic memory** — knowledge retrieved by similarity/relevance, used where relationships are
  fuzzy or cannot be enumerated in advance.
- **Capability** — a stable, named requirement (e.g. `reasoning`, `image-generation`,
  `file-write`) that a task is translated into, and that a model/tool either does or does not
  satisfy. Capabilities are the stable vocabulary the Router uses instead of indexing raw task
  text.
- **Request Type** — a named, contract-defined reason one agent may call another (e.g.
  `REPLAN_TASK`, `RESEARCH_ALTERNATE_ROUTE`).
- **Call envelope** — the structured payload an agent sends when it delegates a request to
  another agent through the directory.
- **Local phone book** — the subset of the directory a given agent actually receives: only the
  outgoing calls it is currently authorized to make.
- **Ontology** — the current set of entity types, relationship types, and schema rules the brain
  is organized around. Versioned data, not hard-coded application logic.
- **Job Board / Design Catalog** — an advisory catalog of candidate agent roles and organization
  topologies, maintained by HR, distinct from the live, authoritative Organizational Directory.
