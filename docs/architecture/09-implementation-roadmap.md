# Implementation Roadmap

## Why top-down instead of bottom-up

The project was originally planned bottom-up: implement Router → Worker → QC → Planner →
Coordinator first, then gradually add feedback loops, memory, additional agents, and management.
That plan has changed. The system is now being built **top-down**: establish the architecture
and the operational knowledge base first, then a small management organization, then the
project-execution organization underneath it. The current frontend/server implementation is
treated as a useful scaffold to return to later, not a foundation to keep extending in the
meantime.

**The application runtime is currently treated as paused.** Do not refactor the existing
frontend/server to match the target architecture described in this documentation set until the
roadmap explicitly reaches that phase (Step 10 below). Changes driven purely by "this doesn't
match the target architecture yet" are out of scope until then.

## This is a strategy, not a locked commitment

Building top-down is a bet that a working management organization will make the rest of the
company faster and easier to build and maintain — it is not an irreversible architectural
decision. If management-first development produces too much infrastructure/design sprawl before
it delivers useful leverage, the implementation order can change.

A partially-prepared bottom-up alternative remains available:

```
Router → Worker → (later) QC → Planner → Coordinator → management
```

A Router can operate against a limited slice of the Execution Brain (`01-execution-brain.md`) —
models, model-specific APIs, tools, capabilities — without any Organizational Brain
(`03-agent-organization.md`) or management organization (`08-organizational-governance.md`)
existing yet. A Worker can then consume the resulting route plus relevant skills
(`04-skills.md`). That slice alone would prove a significant part of the structural-brain/
database design on its own.

**Consequence for MongoDB design:** the Execution Brain is the shared foundation useful under
either strategy and should be designed and seeded first regardless of which path is chosen. The
Organizational Brain and the management-organization collections are specifically required by
the top-down path — avoid designing the database so it only works if the entire management
organization is built first. Whether the first executable slice is a lightweight management
agent or a Router/Worker pair is an open decision (see `decisions/open-decisions.md`), to be made
once MongoDB schema design is underway.

## Sequence

The sequence below reflects the current top-down strategy; see the alternate path above if
priorities change.

1. **Establish the canonical architecture documentation** — this directory. *(Current phase.)*
2. Connect Claude Code to MongoDB through the official MongoDB MCP tooling.
3. Design the MongoDB ontology and collections (Execution Brain, Organizational Brain, skills,
   ontology-version records — the concrete schemas intentionally deferred by
   `01-execution-brain.md`, `03-agent-organization.md`, `04-skills.md`, and
   `05-ontology-versioning.md`).
4. Establish **minimal** version-awareness, backup, and structural indexing (stable IDs, a
   `version` field, active/deprecated status). The full automated governance lifecycle
   (propose/validate/snapshot/migrate/activate/measure/rollback) is a later capability, not a
   prerequisite here — see `05-ontology-versioning.md`.
5. Populate foundational operational knowledge: models, APIs, tools, skills, relationships,
   agents, directory entries, request types.
6. Build the management organization: CEO, HR, Maintenance, Analytics (initially Advisory /
   proposal-only per `08-organizational-governance.md`).
7. Give the management organization controlled access to: MongoDB knowledge, research tools,
   project/repository information, and approved agent-call mechanisms
   (`03-agent-organization.md`).
8. Build the frontend/server interfaces required to operate that management organization (e.g.
   a Maintenance page, management tickets, review/approval interfaces, analytics views,
   organizational views).
9. Allow management agents to begin researching, proposing, and maintaining the organization's
   own configuration.
10. Build the project-execution organization underneath the management layer: Project
    Coordinator, Planner, Router, Worker, Quality Control (`02-project-workflow.md`). **This is
    when it becomes appropriate to revisit and evolve the existing frontend/server.**
11. Gradually increase autonomous authority as the system proves itself, per the progressive
    autonomy principle in `00-overview.md`.

## Current status

| Step | Status |
|---|---|
| 1. Architecture documentation | In progress (this document set) |
| 2–11 | Not started |

## Current repo inventory relevant to this roadmap

- Working today: React/Vite frontend, Console/Output pages, viewport/window infrastructure,
  Express backend, Azure OpenAI Responses API integration, Microsoft Foundry model
  configuration, filesystem-served model/API reference Markdown (`brain/`).
- Present but empty/unused: `server/Runtime/Supervisor`, `server/Runtime/Worker`,
  `server/Runtime/State/*`, `server/Runtime/Memory/*`, `server/Services/Files/FileService.js`,
  `brain/commands/`, `brain/skills/`, `brain/tools/`, `brain/memory/`, `brain/tasks/`.
- Not present at all: MongoDB connection/driver, any agent role beyond the single fixed router
  model call, any directory/kernel enforcement, any ontology-versioning mechanism.

## Superseded historical material

`autonomous-agent-notes/` contains the exploratory research this documentation set was derived
from. It is historical and superseded by `docs/architecture/` — do not treat it as a live design
source going forward. It is expected to be removed from the repository after this documentation
is reviewed.
