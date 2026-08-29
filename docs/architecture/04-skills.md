# Skills

## Purpose

Skills are procedural knowledge: **how to perform useful work once a route is known.** This is a
different problem from the Execution Brain (`01-execution-brain.md`), which determines *what*
route is valid in the first place.

| | Execution Brain | Skill System |
|---|---|---|
| Answers | What route is valid? | How do I do the work? |
| Shape | Sparse relationship tensor | Decision tree / branching procedure |
| Retrieval | Exact indexed queries | Decision-tree traversal, optional semantic discovery |

## Resolved decision: Agent Skills standard for packaging

An earlier version of this design proposed inventing a bespoke skill file format and tree
structure from scratch. **This is superseded.** The system instead adopts the external **Agent
Skills** standard as the portable package format, and adds a MongoDB layer above it for
everything that standard does not cover.

Division of responsibility:

- **Agent Skills standard defines the package**: a directory containing `SKILL.md` (YAML
  frontmatter + Markdown), with optional `references/`, `scripts/`, and `assets/` subfolders.
- **MongoDB defines the skill graph**: when a skill applies, which branch to follow, which agents
  may use it, compatibility with models/tools, and how it is versioned and governed.

A skill package remains portable and human/agent-readable on its own; the MongoDB layer is what
makes it *discoverable and governable* inside this system specifically.

## Progressive loading

Skills are a primary place the progressive-loading principle (`00-overview.md`) applies directly:

| Level | Loaded | Purpose |
|---|---|---|
| 1 — Metadata | Always, for discovery | Name + description let a Worker or skill selector decide relevance without loading anything else |
| 2 — SKILL.md | When the skill activates | Core procedure, boundaries, decision points, references to deeper material |
| 3 — Resources | Only when a specific branch needs them | Focused reference Markdown, deterministic scripts, templates, examples |

This is a deliberate token-control strategy: each decision narrows the branch before more
context is loaded, rather than loading an entire procedural library up front.

## Decision graphs

A skill can be more than a flat instruction file — it can be a decision procedure. MongoDB
stores the decision graph (which branch/condition leads to which reference or script); the
Agent Skills package supplies the actual instructions and resources for whichever branch is
selected.

```
TASK → skill metadata → activate SKILL.md → decision node
                                              ├─ condition A → reference A
                                              ├─ condition B → reference B
                                              └─ condition C → script/reference C
       → execute selected procedure
```

## Worker skill lifecycle

1. **Discover** — the Worker receives only skill metadata/candidate IDs relevant to the current
   task (progressive loading, not the whole library).
2. **Activate** — if a skill is selected, load its `SKILL.md`.
3. **Navigate** — follow the decision graph and the skill's own references rather than loading
   every file in the package.
4. **Execute** — read focused references or run deterministic scripts only when the selected
   branch requires them.
5. **Self-check** — validate the task result independently of the skill's own instructions.
6. **Learn** — if no suitable branch exists, complete the task with general reasoning and return
   a proposed new branch or skill revision rather than leaving the gap undocumented.
7. **Govern** — proposed changes are stored as draft versions; an active skill is never silently
   replaced.

## Governance and versioning

Skills use the same versioned-governance philosophy as the ontology (`05-ontology-versioning.md`):
every revision records its parent version, the task/run that motivated it, the authoring agent,
supporting QC evidence, and its dependencies on specific tools/models — so a future Maintenance
process can detect that a skill references an obsolete tool or API and propose a new version
without destroying history.

Suggested lifecycle states: `draft → tested → validated → active → deprecated`.

## Current repo state vs. target architecture

No skill system exists in the current runtime. `brain/skills/skills.md` is an empty placeholder
file. This is target architecture; the concrete MongoDB collections for skills, skill versions,
and decision graphs are a Phase 3 design task (`09-implementation-roadmap.md`) and are not
specified here.
