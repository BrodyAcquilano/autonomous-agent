# Open Decisions

This document tracks implementation choices that are **intentionally not yet decided**. Do not
resolve these silently in code or in another document — bring them back to Brody/ChatGPT/Claude
Code discussion when they become blocking, and update this file (moving resolved items into the
relevant canonical document, with a note of what was decided and why) once they are.

Several items from earlier architecture review are now resolved and are documented in place
rather than listed here: MongoDB as the persistent brain (with Markdown content stored directly
as a `contentMarkdown` string field alongside structural metadata — no Git-as-source/Mongo-as-
index dual system, no object storage for ordinary brain content), task-not-a-tensor-dimension,
Execution/Organizational Brain separation, delegated calling as the target, the Agent Skills
standard, ontology-as-versioned-data (with only minimal version-awareness required initially —
see `05-ontology-versioning.md`), the Maintenance default policy, CEO autonomy progression, and
Vector Search being optional rather than a prerequisite for the first implementation. What
remains open:

## 1. Concrete MongoDB collection schemas

**Further resolved.** Beyond the Execution Brain slice (`models`, `apis`, `tools`, `capabilities`,
`platforms` — see `01-execution-brain.md`), a first Organizational Brain schema now also exists:
`agents` (profile-card prompts) and `directory` (agent/contact/request-type documents — see
`03-agent-organization.md`), plus `analytics.router` (per-run process trace) and
`maintenance.tickets` (see `07-analytics.md`, `06-maintenance.md`). What remains undesigned:
skills/skill-version schema, ontology-version records, and — notably — the directory schema above
is descriptive data only; a schema for the call envelope / kernel-enforcement layer that would
actually validate an edge before a call happens has not been designed.

## 2. Migration timing/mechanics for the filesystem `brain/` prototype

MongoDB is the canonical source for operational brain content going forward (resolved) — the
filesystem `brain/` directory is prototype content, not a permanent parallel source of truth.
What remains open is *when and how* the existing `brain/models/*.md` / `brain/apis/**/*.md`
content gets migrated in, and whether the current filesystem-serving routes are replaced outright
or kept briefly during a transition.

## 3. Numeric limits for delegated calling

`03-agent-organization.md` requires call budgets, call-depth limits, and repeated-edge/cycle
limits to exist, but no actual default numbers (max depth, max repeated calls per task, token/
cost budget defaults) have been chosen.

## 4. Initial seed set

**Partially resolved.** The Execution Brain is seeded with a deliberately tiny set: 3 models
(`gpt-5.6-terra`, `gpt-5.3-codex`, `gpt-image-2`), 1 platform, 3 model-scoped API documents, 3
tools and 3 capabilities (all currently under `gpt-5.6-terra`'s Responses API route) — enough to
exercise every node of the funnel at least once. Which agent roles and request types get seeded
first for the Organizational Brain (once that system is built) is still open.

## 5. Reconciling the current Console flow with the future Router/Worker path

The current Console page makes a single direct call to a fixed router model. It has not been
decided whether this becomes one entry point into the future Router/Worker/QC path, is replaced
outright, or continues to exist as a separate "quick chat" mode alongside full project
execution.

## 6. Human-approval interface mechanics

Every governance document (Maintenance, Ontology Versioning, Organizational Governance)
references "human approval" as a gate, but the actual review/approval UI and workflow (a
Maintenance page, a general review queue, notification mechanics beyond "email is an alert
channel") has not been designed.

## 7. MCP/tool access boundaries per management role

**Partially resolved for the two roles that exist.** The `directory` collection's `request_types`
documents now concretely record this for `router` (read/write on `autonomous`, plus calls to the
`analytics` agent and the maintenance portal) and `analytics` (read-only on `analytics`, plus
calls to the maintenance portal) — see `03-agent-organization.md`. What CEO/HR/Maintenance may
access once they exist, and which external research tools any role may invoke, remains open.

## 8. Backup/archive retention periods

`06-maintenance.md` and `05-ontology-versioning.md` both require backups/archived versions to be
retained for some period before being eligible for cleanup. No retention policy (e.g. 7/30/90
days) has been chosen.

## 9. First executable slice: lightweight management agent vs. Router/Worker

**Resolved in practice, informally.** Neither pure strategy was followed. A working Router agent
was built (the bottom-up path), but a narrow Analytics agent was built alongside it rather than
after it, because the Router needed a safety monitor to be usable at all — not because the
top-down management-organization sequencing was deliberately resumed. No Maintenance, HR, or CEO
agent exists. Treat this as evidence that the two strategies aren't strictly exclusive in
practice, not as a decision that the top-down sequencing in `09-implementation-roadmap.md` has
been abandoned.
