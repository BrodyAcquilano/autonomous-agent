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
- **Capability** — a stable, named requirement a task can be translated into (e.g. `reasoning`,
  `vision`, `image-generation`, `structured-output`, `file-write`). Capabilities are the stable
  vocabulary of the Execution Brain.
- **Provider** and **Deployment** — the underlying account/infrastructure facts a route resolves
  to (e.g. an Azure OpenAI deployment name), kept separate from model/API identity itself.

## Relationships are a sparse tensor

The valid, meaningful combinations of these entities form a sparse relationship structure, not a
dense table:

```
API × Model
Model × Capability
Model × Tool
API × Model × Tool
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

## Resolved decision: task is not a tensor dimension

An earlier version of this design considered indexing `API × Model × Task × Tool`, treating Task
as a stable axis alongside the others. **This is superseded.** Project/task text is open-ended
natural language produced by a Planner and cannot be enumerated in advance; requiring every
possible task to have a pre-indexed route would force either constant schema growth or routing
failures on ordinary novel work.

Instead:

```
TASK (runtime input, natural language)
  ↓  Router interprets the task
CAPABILITIES (stable vocabulary)
  ↓
MODEL → API → TOOLS (resolved via the Execution Brain tensor above)
```

Optional **task archetypes** (e.g. `generate-image`, `write-code`, `review-code`) may exist as
routing *hints* that map to preferred capabilities/models/tools for common cases, but the system
must remain able to route a task that matches no archetype. Task archetypes optimize common
work; they do not define the limits of the system.

## Routing precedence

When more than one relationship record could apply, more specific relationships override more
general ones. Suggested precedence, most to least specific:

```
API × Model × Tool
API × Model
Model × Tool
Model × Capability
single-entity documents (Model, API, Tool alone)
```

This precedence must be enforced by the implementation, not left as an implicit convention — two
relationship records at the same specificity should never be allowed to silently conflict.

## Retrieval procedure

1. Router translates the task into required capabilities.
2. Identify candidate models satisfying those capabilities (`Model × Capability`).
3. Select a model (default configuration, cost, latency, availability, or an AI router for
   ambiguous cases).
4. Resolve a valid API for that model (`API × Model`).
5. Resolve valid tools for that model/API combination.
6. Fetch the most specific relationship record available, falling back through the precedence
   order above.
7. Only fall back to semantic/vector search if the exact relationship is missing, incomplete, or
   explicitly points to further material.
8. Execute using the resolved route.

Every execution should be traceable back to the exact relationship record(s) that informed it.

## Current repo state vs. target architecture

- **Current repo state:** `brain/models/*.md` and `brain/apis/**/*.md` are flat Markdown files
  read directly off disk by `server/Routes/Models` and `server/Routes/Apis` at request time, and
  served to the frontend's Models/Resources pages. Model→deployment mapping is a hardcoded
  `switch` statement in `server/Services/Azure/OpenAIResponses.js` (`getAzureConfig`). There is
  no capability vocabulary, no relationship tensor, and no support-status tracking — routing
  today is a single fixed router model (`gpt-5.6-terra`) with no Router agent.
- **Target architecture:** the Execution Brain is persisted in MongoDB (per the resolved
  decision in `05-ontology-versioning.md`'s scope and the overall project direction). The
  existing filesystem `brain/` content is prototype/reference material be migrated from, not the
  long-term store. Concrete MongoDB collections and field-level schema for models/apis/tools/
  capabilities/relationships are a Phase 3 design task (`09-implementation-roadmap.md`) and are
  intentionally not specified in this document.

## Security boundary

Relationship documents describe *what* a provider needs (API key, deployment name, base URL) —
they never contain the actual secret values. Credentials remain server-side configuration
injected at execution time, never brain content.
