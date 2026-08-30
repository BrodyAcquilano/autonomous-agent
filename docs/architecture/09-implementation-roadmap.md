# Implementation Roadmap

## Why top-down instead of bottom-up

The project was originally planned bottom-up: implement Router → Worker → QC → Planner →
Coordinator first, then gradually add feedback loops, memory, additional agents, and management.
That plan has changed. The system is now being built **top-down**: establish the architecture
and the operational knowledge base first, then a small management organization, then the
project-execution organization underneath it. The current frontend/server implementation is
treated as a useful scaffold to return to later, not a foundation to keep extending in the
meantime.

**The application runtime was treated as paused, and that has since been deliberately broken for
one slice of it: a real Router agent now exists and the Console page calls it directly** (see
Steps 2–5 below and `01-capabilities-brain.md`/`03-agent-organization.md`). That was a conscious
choice to prove the Capabilities Brain design end-to-end, not a general reopening of the frontend/
server — do not refactor the rest of the existing frontend/server (Coordinator/Planner/Worker/QC,
Maintenance page, Analytics dashboards) to match target architecture beyond what Steps 2–6 below
already describe as done. Changes driven purely by "this doesn't match the target architecture
yet" are still out of scope until the roadmap explicitly reaches that phase (Step 10 below).

## This is a strategy, not a locked commitment

Building top-down is a bet that a working management organization will make the rest of the
company faster and easier to build and maintain — it is not an irreversible architectural
decision. If management-first development produces too much infrastructure/design sprawl before
it delivers useful leverage, the implementation order can change.

A partially-prepared bottom-up alternative remains available:

```
Router → Worker → (later) QC → Planner → Coordinator → management
```

A Router can operate against a limited slice of the Capabilities Brain (`01-capabilities-brain.md`) —
models, model-specific APIs, tools, capabilities — without any Organizational Brain
(`03-agent-organization.md`) or management organization (`08-organizational-governance.md`)
existing yet. A Worker can then consume the resulting route plus relevant skills
(`04-skills.md`). That slice alone would prove a significant part of the structural-brain/
database design on its own.

**Consequence for MongoDB design:** the Capabilities Brain is the shared foundation useful under
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
3. Design the MongoDB ontology and collections (Capabilities Brain, Organizational Brain, skills,
   ontology-version records — the concrete schemas intentionally deferred by
   `01-capabilities-brain.md`, `03-agent-organization.md`, `04-skills.md`, and
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
| 1. Architecture documentation | Ongoing — living document set, updated as design choices land |
| 2. Connect to MongoDB | Done |
| 3. Design MongoDB ontology/collections | Substantially done for the Capabilities Brain (`models`, `apis`, `tools`, `capabilities`, `platforms`) and a first slice of the Organizational Brain (`agents`, `directory`) and the Analytics/Maintenance data stores (`analytics.router`; `maintenance.router`/`maintenance.analyst`, one collection per originating agent). Skill and ontology-version schemas remain undesigned. |
| 4. Minimal version-awareness/indexing | Done for every collection that exists — `version`/`status` fields and stable-id indexes throughout |
| 5. Populate foundational knowledge | Done for a deliberately tiny seed set: 3 models, 1 platform, 3 model-scoped APIs, 3 tools, 3 seeded capabilities (plus router-suggested ones as they're proposed), 2 agent profiles (`router`, `analytics`), 12 directory documents |
| 6. Build the management organization | Started narrowly, not as originally sequenced — see note below |
| 7–11 | Not started |

**Note on Step 6:** what actually got built is a working Analyst agent that reviews the Router's
own process stage-by-stage and can flag a maintenance ticket or halt a run — a real but narrow
slice of the Analytics role in `07-analytics.md`, not the full cross-system reporting/HR/CEO
management organization this step describes. No Maintenance, HR, or CEO agent exists. This
happened because the Router needed a safety monitor to be usable at all, not because the top-down
sequencing below was resumed — see the note in `decisions/open-decisions.md` item 9.

## Current repo inventory relevant to this roadmap

- **Working today:** React/Vite frontend, Console/Output pages, viewport/window infrastructure,
  the Models page (browses the Capabilities Brain end-to-end via a branching model → API → tool →
  capability info modal), Express backend, Azure OpenAI Responses + Images API integration, a
  single shared `MongoClient` connected across three logical databases (`autonomous`, `analytics`,
  `maintenance`), and a real multi-stage Router agent (`server/Services/Router/RouterAgent.js`)
  that the Console page calls directly instead of building an Azure request itself.
- **Populated MongoDB collections:** `models`, `apis`, `tools`, `capabilities`, `platforms`
  (`autonomous` — Capabilities Brain); `agents`, `directory` (`autonomous` — a first slice of the
  Organizational Brain: profile-card prompts and a three-level agent/contact/request-type calling
  structure, not yet enforced by any runtime kernel check); `router` (`analytics` — one document
  per Router run, with a full per-stage trace, written by the server itself); `router` and
  `analytics` (`maintenance` — one collection per *originating* agent, not per agent that
  physically writes: the Router's own decisions land in `maintenance.router`, and tickets the
  Analyst agent flags during review land in `maintenance.analyst` even though the Router's
  code performs that write too, since Analytics has no database access of its own. Reviewed
  directly by a human today, with no automated triage).
- **Present but empty/unused:** `server/Runtime/Supervisor`, `server/Runtime/Worker`,
  `server/Runtime/State/*`, `server/Runtime/Memory/*`, `server/Services/Files/FileService.js`,
  `brain/commands/`, `brain/skills/`, `brain/tasks/`. `brain/models/` and `brain/apis/` are no
  longer merely unused — they are actively superseded by the MongoDB collections above and no
  route reads them anymore.
- **Not present at all:** a runtime kernel that validates a directory edge/request type before a
  call happens (today's `directory` documents structure but doesn't gate anything), any
  Maintenance/HR/CEO agent, any Project Coordinator/Planner/Worker-as-a-separate-role/QC role,
  any frontend dashboard or report built from analytics data, and any numeric call-depth/budget/
  cycle limits.

## Superseded historical material

`autonomous-agent-notes/` contains the exploratory research this documentation set was derived
from. It is historical and superseded by `docs/architecture/` — do not treat it as a live design
source going forward. It is expected to be removed from the repository after this documentation
is reviewed.
