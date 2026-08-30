# Skills

## Purpose

Skills describe **what a standing agent already knows how to do** — the reverse perspective from
the Capabilities Brain (`01-capabilities-brain.md`). The Capabilities Brain is task-first: given
one task, narrow from a broad catalog down to an exact, disposable configuration for a temp
worker built for that task alone, going general → specific. Skills are agent-first: given a task,
*which of the company's existing, standing agents* (recorded in the `agents` collection) already
has a matching skill, and could be recruited to do it instead of the Router assembling a fresh
temp worker?

| | Capabilities Brain | Skills |
|---|---|---|
| Direction | General → specific, per task | Agent → what it already knows, searched by task |
| Produces | A disposable route for one task | A shortlist of existing-agent candidates |
| Retrieval | Exact indexed funnel (Model → API → Tool → Capability) | Candidate search across agent profiles — not an exact lookup |
| Used by | The Router, on every task | A future recruitment flow (HR/the CEO), not every task |

## Resolved decision: Skills are not the Capabilities Brain's execution mechanism

An earlier version of this design treated Skills as the thing a Worker consults mid-task to learn
*how* to do specific work once a route is known. **This is superseded.** The Capabilities Brain
already solves that: a capability document, scoped to one Tool, tells a temp worker exactly how
to configure that tool for a kind of task (see `01-capabilities-brain.md`). Skills do not need to
duplicate that job, and going forward they don't — the Capabilities Brain's general-to-specific
funnel is what a task consults to learn *how*; Skills are what an *agent's own profile* lists
about what it already knows, for someone else to search.

## Resolved decision: Agent Skills standard for packaging (retained)

The external **Agent Skills** standard (a directory containing `SKILL.md` with optional
`references/`, `scripts/`, `assets/` subfolders) remains the right portable package format for a
skill entry whenever it needs more than a short description — that packaging decision from the
earlier version of this document still holds. Only the consumer and purpose of a skill entry has
changed: it lives on an agent's own profile card in `agents` (see `03-agent-organization.md`)
describing that agent, rather than being loaded mid-task by a Worker executing a resolved route.

## Relationship to the Directory and to future recruitment

Neither the Capabilities Brain nor the Organizational Brain's directory
(`03-agent-organization.md`) covers what Skills are for. Both of those are **deterministic**: the
Capabilities Brain funnels one task through an exact structural path with no branching search, and
the Directory is a fixed decision tree — each agent is told in advance exactly who it may call and
what it may request. A Skills-based recruitment flow is different in kind:

- **Not part of the current circuit.** The Router's stage sequence never consults Skills or asks
  "which agent should do this" — it always builds a fresh temp-worker configuration for the task
  in front of it via the Capabilities Brain. A Skills-based recruitment flow would be a separate,
  later capability, most likely invoked by HR/the CEO (`08-organizational-governance.md`), not by
  the Router.
- **Requires a real search, not an indexed lookup.** Finding which agents have a matching skill
  means scanning candidates and generating a shortlist — closer to the Job Board's candidate
  curation in `08-organizational-governance.md` than to the Capabilities Brain's exact funnel or
  the Directory's fixed edges.
- **Needs signals this system doesn't track yet.** Whether an agent is currently busy, and its
  running token/cost usage, would both plausibly affect which candidate gets picked for a task —
  neither is tracked anywhere today. A skill-name match alone is not enough to pick an agent.

The expected future shape: HR curates a shortlist of agents whose listed skills match a task (a
job-board-style search across `agents`), and the CEO selects one from that shortlist — mirroring
the `08-organizational-governance.md` Job Board flow, but for *recruiting an existing standing
agent for a task* rather than *designing and instantiating a new role*.

## Progressive loading

Skills are a primary place the progressive-loading principle (`00-overview.md`) applies directly,
once an agent has actually been recruited via a skill match and needs to act on it:

| Level | Loaded | Purpose |
|---|---|---|
| 1 — Metadata | Always, for discovery | Name + description let a recruitment search or an agent itself decide relevance without loading anything else |
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

## Agent skill lifecycle

1. **Discover** — a recruitment search (or the agent itself) receives only skill metadata/
   candidate IDs relevant to the current task (progressive loading, not the whole library).
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

No skill system exists in the current runtime, and — beyond simply being unbuilt — its intended
purpose has also narrowed since the original design: Skills are no longer expected to be the
Capabilities Brain's execution mechanism (that job now belongs to capability documents, see
`01-capabilities-brain.md`), but a future agent-recruitment search keyed on the `agents`
collection (`03-agent-organization.md`). `brain/skills/skills.md` is an empty placeholder file.
Concrete MongoDB collections for skills, skill versions, and the recruitment search itself are not
specified here.
