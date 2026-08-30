# Execution Brain

## Purpose

The Execution Brain is the structural knowledge base that answers: **how can a given piece of
work actually be executed?** It stores stable facts about models, APIs, tools, and capabilities,
and the valid relationships between them. It is deliberately separate from the Organizational
Brain (`03-agent-organization.md`), which answers a different question — who may call whom.

## Structural vs. semantic knowledge

Not every fact belongs in the same kind of store.

- **Structural knowledge** is used when a relationship can be explicitly defined in advance:
  "Model X is supported by API Y," "Model X supports capability Z." This should be retrievable
  by exact, indexed lookup.
- **Semantic knowledge** is used when the relationship is fuzzy or cannot be fully enumerated in
  advance: project history, prior notes, loosely related context. This is retrieved by
  similarity search.

Critical operational facts (what a model/API/tool combination actually supports, and how to use
it) should default to structural storage. Semantic search remains valuable, but only *after*
structural filtering has narrowed the candidate set — never as the mechanism that establishes
whether a route is valid.

```
STRUCTURAL FILTER → EXACT RELATIONSHIP → (SEMANTIC SEARCH IF NEEDED) → WORKING CONTEXT → EXECUTION
```

## Entities

- **Model** — a specific model made available through a provider/deployment.
- **API** — an integration surface (e.g. Azure OpenAI Responses API) through which a model is
  called.
- **Tool** — a capability a model can invoke during execution (e.g. code interpreter, image
  generation, web search, file access).
- **Capability** — a concrete, reusable recipe for configuring one specific **Tool** for one kind
  of task: which request fields to layer on top of the model/API's default request shape, with
  example/default parameter values (e.g. an `image-generation-request` capability under the
  `image-generation` tool, carrying default `quality`/`size` values). A capability always belongs
  to exactly one Tool — it is the leaf of the routing funnel below, not an independent axis off
  the Model or API directly. It is a library of known-good configurations the Router can reuse,
  not an exhaustive gate: if no capability document matches a task, the Worker can still configure
  the tool reasonably on its own from the tool's own documentation. (This is a narrower, concrete
  refinement of the general "stable task requirement" framing of Capability used elsewhere in this
  documentation set — this document describes how the concept is actually realized for routing.)
- **Provider** and **Deployment** — the underlying account/infrastructure facts a route resolves
  to (e.g. an Azure OpenAI deployment name), kept separate from model/API identity itself.

## Relationships are a sparse tensor

The valid, meaningful combinations of these entities form a sparse relationship structure, not a
dense table. Three are genuinely independent coordinates; Capability is a refinement nested under
Tool, not an independent axis:

```
API × Model
Model × Tool
API × Model × Tool
Tool × Capability          (nested: a capability always names exactly one tool)
```

Each non-empty coordinate points to a relationship record (and, where useful, a document
explaining that specific relationship — provider-specific request rules, known limitations,
troubleshooting). Only meaningful relationships need records; the theoretical Cartesian product
of all entities is never materialized.

Each relationship has an explicit support status — not a plain boolean:

- `SUPPORTED`
- `UNSUPPORTED`
- `UNKNOWN` — the brain does not currently know; this must never be treated as `UNSUPPORTED`.
- `DEPRECATED`

## Routing is a one-directional funnel

Although the entities above form a tensor structurally, the Router walks them in one fixed
direction, narrowing at each step, rather than treating all of them as coequal lookup keys:

```
Model  →  API  →  Tool  →  Capability
(broadest)                  (most specific)
```

This mirrors how a new employee is onboarded onto unfamiliar equipment: first they're shown the
building (which machine — Model — is right for this kind of work), then the specific machine
(which API surface exposes it), then a specific part of that machine (which Tool that part
provides), then exactly how to operate that part (the Capability's worked configuration example).
Each step only makes sense once the previous one has already narrowed the field.

**Why Model is the top node, not API or Platform.** Every model in this application currently runs
on the same platform (Azure via Microsoft Foundry), so Platform is shared reference information,
not a useful first discriminator today — it doesn't help the Router tell two candidate routes
apart. Model, on the other hand, is exactly the axis a router should reason about first when given
a task: "which model is generally suited to this kind of work?" is answerable from a model's own
description before any API, tool, or parameter detail is considered. Starting broad and narrowing
keeps the number of nodes small at the top of the funnel, where the model catalog is short and
general; variety is deliberately pushed to the bottom of the funnel, where Capability documents can
multiply per tool without ever widening the top-level decision.

**Tools are independent add-ons, not alternative branches.** Once an API is chosen, more than one
Tool can be attached to the same request — each tool contributes its own fragment to the final
request (typically one more entry in a `tools[]`-style array) independently of the others.
Choosing zero tools is also valid: the API's own default request shape is a complete, correct
route on its own for a task that needs no tool. Capability documents exist specifically to show a
worked example of configuring *one* tool for *one* kind of task; they are not consulted until a
tool has already been selected, and are optional even then — if none exists for a given need, the
Worker configures the tool directly from the tool's own documentation rather than failing.

## Ad-hoc routing vs. predetermined agents

The Execution Brain's funnel exists to let the Router assemble a **custom, temporary configuration
for one task** out of raw building blocks (Model, API, Tool, Capability) — closer to briefing a
temp worker for a single job than to assigning a pre-built specialist. This is deliberate: the
Router does not pick from a fixed roster of pre-designed agents, each hand-built with its own
skill list in advance; it composes the smallest sufficient configuration from everything currently
allowed, for exactly the task in front of it. This lets the system handle novel tasks without
requiring a new predesigned agent for every combination of model, tool, and use case.

This is a different philosophy from the standing, skilled agents the company also has. The
Organizational Brain (`03-agent-organization.md`) and the Agent Skills system (`04-skills.md`)
describe agents with fixed roles, fixed responsibilities, and a defined set of skills, called
through an authorized directory of who-may-call-whom — real, persistent members of the
organization. The Router described in this document is not one of them; it is the mechanism by
which the organization figures out how to brief a one-off worker for a single execution step. The
two systems are complementary, not competing: a standing agent (e.g. the Worker role in
`02-project-workflow.md`) is often *the thing that receives* a route the Execution Brain resolved,
but the route itself is assembled fresh per task rather than being one of that agent's
pre-declared skills.

## Resolved decision: task is not a tensor dimension

An earlier version of this design considered indexing `API × Model × Task × Tool`, treating Task
as a stable axis alongside the others. **This is superseded.** Project/task text is open-ended
natural language produced by a Planner and cannot be enumerated in advance; requiring every
possible task to have a pre-indexed route would force either constant schema growth or routing
failures on ordinary novel work.

Instead, the task is the input the Router reasons about at the top of the funnel, not a translated
lookup key:

```
TASK (runtime input, natural language)
  ↓  Router reads the task against each Model's own description
MODEL → API → TOOL(S) → CAPABILITY (per tool, if a matching recipe exists)
```

Optional **task archetypes** (e.g. `generate-image`, `write-code`, `review-code`) may exist as
routing *hints* that map to preferred models/tools for common cases, but the system must remain
able to route a task that matches no archetype. Task archetypes optimize common work; they do not
define the limits of the system.

## Funnel fallback (no precedence conflicts)

Because routing is a strict one-directional funnel rather than several coequal coordinate types
competing for the same task, there is no ambiguity to resolve between multiple relationship
records at the same specificity — each node in the funnel has at most one home for a given
(model[, api[, tool]]) key by construction. What matters instead is what happens when a node
further down the funnel has no matching record:

- No API document for a model → the model is not currently routable; this is a gap to report, not
  silently guess around.
- No Tool documents for a model/API pair → that is not an error. It means the route stops at the
  API's own default request shape, which is a complete, valid route on its own.
- No Capability document for a tool the task needs → also not an error. It means the Worker
  configures that tool directly from the tool's own document instead of a pre-written example.

## Retrieval procedure

1. Router evaluates the task against each Model's own description to select a candidate model —
   the broadest node of the funnel.
2. Resolve the API document(s) for that model (`Model → API`) and select one.
3. Read that API document's default request shape and adjustable parameters. If the task needs no
   tool, this alone is the resolved route.
4. If the task needs a tool, resolve the Tool document(s) scoped to that model + API
   (`API × Model × Tool`) and select every tool the task actually needs — more than one may apply,
   and each contributes its own fragment to the final request independently of the others.
5. For each selected tool, check whether a Capability document exists for it (`Tool → Capability`)
   matching the kind of task at hand; if so, use its request template as a starting point. If none
   exists, configure the tool directly from its own document instead — a missing capability is not
   a blocking error.
6. Assemble the final request by layering each selected tool's configuration on top of the API's
   default request shape.
7. Only fall back to semantic/vector search if a document needed at any step is missing or
   incomplete in a way none of the above resolves.
8. Execute using the resolved route.

Every execution should be traceable back to the exact document(s) that informed it.

## Current repo state vs. target architecture

- **Current repo state:** `server/Routes/Models`, `server/Routes/Apis`, `server/Routes/Tools`, and
  `server/Routes/Capabilities` now read live from the MongoDB collections described below and are
  browsable end-to-end from the frontend's Models page (a branching model → API → tool →
  capability info modal). `brain/models/*.md` and `brain/apis/**/*.md` are no longer read by any
  route — retained only as historical reference pending deletion. Model→deployment mapping is
  still a hardcoded `switch` statement in `server/Services/Azure/OpenAIResponses.js`
  (`getAzureConfig`), unrelated to the new browsing routes. A working Router agent now exists and
  reads these collections live (`server/Services/Router/RouterAgent.js`, mounted at
  `/api/router/request`, called directly from the Console page) — it is not yet embedded in the
  fuller Planner/Coordinator/Worker/QC pipeline described in `02-project-workflow.md`, and for now
  performs both routing and execution itself. See `03-agent-organization.md` for how the Router's
  own identity and calls are recorded, and `09-implementation-roadmap.md` for overall status.
- **Target architecture:** the Execution Brain is persisted in MongoDB (per the resolved decision
  in `05-ontology-versioning.md`'s scope and the overall project direction). The existing
  filesystem `brain/` content is prototype/reference material, superseded by the live MongoDB
  collections and no longer read by any route. Phase 3 (`09-implementation-roadmap.md`) is now
  underway: concrete collections exist in MongoDB — `models`, `apis`, `tools`, and `capabilities`
  (plus a `platforms` collection for shared platform-level facts) — following the one-directional
  funnel described above, with `apis`/`tools`/`capabilities` each scoped by reference fields
  (`model`, `api`, `tool`) rather than being generic shared entities. Field-level schema detail is
  intentionally kept out of this document, since it evolves faster than the routing philosophy
  above — inspect the live collections directly, or ask for a current schema summary, rather than
  trusting this document to enumerate exact fields.

## Security boundary

Relationship documents describe *what* a provider needs (API key, deployment name, base URL) —
they never contain the actual secret values. Credentials remain server-side configuration
injected at execution time, never brain content.
