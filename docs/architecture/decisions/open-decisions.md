# Open Decisions

This document tracks implementation choices that are **intentionally not yet decided**. Do not
resolve these silently in code or in another document — bring them back to Brody/ChatGPT/Claude
Code discussion when they become blocking, and update this file (moving resolved items into the
relevant canonical document, with a note of what was decided and why) once they are.

Several items from earlier architecture review are now resolved and are documented in place
rather than listed here: MongoDB as the persistent brain, task-not-a-tensor-dimension,
Execution/Organizational Brain separation, delegated calling as the target, the Agent Skills
standard, ontology-as-versioned-data, the Maintenance default policy, and CEO autonomy
progression. What remains open:

## 1. Concrete MongoDB collection schemas

Field-level schema for models, APIs, tools, capabilities, relationships, agents, directory
edges, request types, skills, skill versions, ontology versions, maintenance tickets, and
analytics events has not been designed yet. This is explicitly Phase 3 of
`09-implementation-roadmap.md` and should happen after MongoDB MCP is connected, not guessed at
in advance.

## 2. Migration path for the filesystem `brain/` prototype

`brain/models/*.md` and `brain/apis/**/*.md` currently work and are served to the frontend. It
has not been decided whether/when/how this content gets migrated into MongoDB, whether the
filesystem routes get replaced outright, or whether a transitional dual-read period is useful.

## 3. Numeric limits for delegated calling

`03-agent-organization.md` requires call budgets, call-depth limits, and repeated-edge/cycle
limits to exist, but no actual default numbers (max depth, max repeated calls per task, token/
cost budget defaults) have been chosen.

## 4. Initial seed set

Which specific models, APIs, tools, capabilities, agent roles, and request types get seeded
first (Step 5 of the roadmap) has not been decided. The intent is to seed a deliberately tiny
set sufficient to prove traversal logic, not a complete catalog, but the exact seed list is
still open.

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

`09-implementation-roadmap.md` Step 7 calls for giving CEO/HR/Maintenance/Analytics "controlled
access" to MongoDB knowledge and research tools, but which specific MongoDB operations and
external research tools each role may invoke has not been defined.

## 8. Backup/archive retention periods

`06-maintenance.md` and `05-ontology-versioning.md` both require backups/archived versions to be
retained for some period before being eligible for cleanup. No retention policy (e.g. 7/30/90
days) has been chosen.
