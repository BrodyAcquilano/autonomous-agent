# Ontology Versioning

## Purpose

This document explains **how** ontology/schema change is governed as a process. It does not
define an actual ontology, actual entity types, or actual version records — those are runtime
brain content that will live in MongoDB once that phase begins (see
`README.md`'s distinction between architecture docs and the runtime brain).

## Resolved decision: ontology is versioned data

The current definitions of agents, models, APIs, tools, capabilities, request types,
relationships, and routing rules are not permanently hard-coded into the application. They are
themselves stored as data, and the application code implements generic operations against
whichever version is currently active: load a schema, query relationships, validate a route,
activate a new version.

This principle applies across every structural system described elsewhere in this documentation
set: the Execution Brain (`01-execution-brain.md`), the Organizational Brain
(`03-agent-organization.md`), and the skill decision-graph shape (`04-skills.md`). None of those
documents should be read as describing a fixed, unchangeable schema — they describe the *current*
target design, which itself can evolve through the process below.

```
brain ontology
├── ontology v1 [archived]
├── ontology v2 [archived]
├── ontology v3 [ACTIVE]
└── ontology v4 [candidate / staged]
```

## What the ontology describes

The ontology defines the entity types the brain organizes (e.g. Agent, Model, API, Tool,
Capability, RequestType, Skill) and the legal relationship types among them (e.g. `Agent → Agent`
qualified by `RequestType`, `Model → API`, `Model → Capability`). The documents stored under
those relationships can remain Markdown so the same knowledge stays directly readable by both
humans and language models.

Relationship documents may also be context-specific rather than globally shared — e.g. how API X
behaves for Model A can be a different document from how API X behaves for Model B, even though
both concern "the same" API. This intentionally reduces ambiguity for the agent doing a specific
job, at the cost of some duplication; both a shared and a context-specific representation are
valid depending on the case.

## Initial scope vs. long-term capability

The full lifecycle below is the target design and should be preserved so future evolution is
possible cleanly, but it is not a prerequisite for the first MongoDB implementation. The initial
system only needs: a documented current schema, stable IDs, explicit structural relationships,
and version-awareness where useful (e.g. a `version` field and an `active`/`deprecated` status on
records expected to change). The full automated `propose → validate → snapshot → migrate →
activate → measure → rollback` engine — with HR/CEO actively proposing changes and the system
autonomously migrating collections — is a later capability, built once the autonomous
organization has real data, analytics, and an actual reason to evolve its own schema. Do not let
building this engine block or dominate the first MongoDB implementation.

## Governance lifecycle

Ontology evolution follows an explicit, staged process rather than direct mutation of the active
schema:

| Stage | Meaning |
|---|---|
| 1. Observe | Analytics, Maintenance, HR research, failed loops, cost, quality, or user feedback reveal a structural problem |
| 2. Propose | HR or the CEO (or, during bootstrap, the temporary human/ChatGPT/Claude Code team) drafts a candidate ontology or directory revision |
| 3. Snapshot | The current ontology and affected documents are backed up before any migration |
| 4. Validate | IDs, references, permissions, required paths, cycles, and migration rules are checked |
| 5. Approve | High-impact structural or permission changes require human approval before proceeding |
| 6. Migrate | Data is transformed or re-indexed into the new ontology version |
| 7. Activate | A single active-version pointer moves from the old ontology to the new one |
| 8. Measure | Analytics compares behavior under the new design against the previous one |
| 9. Roll back | If the new version performs badly, the previous ontology and data snapshot are restored |

Version states are always one of: `archived`, `active`, or `candidate/staged`. Exactly one
version of a given ontology is active at a time.

## Safety boundary

Ontology evolution does not mean unrestricted self-authorization. Structural changes that would
grant new credentials, external-service access, filesystem scope, spending authority, or other
privileged capability must remain controlled by server/kernel policy and, where appropriate,
explicit human approval — regardless of how the ontology-versioning mechanism itself works. This
mirrors the human-authority principle in `00-overview.md` and the Maintenance addition policy in
`06-maintenance.md`.

## Current repo state vs. target architecture

No ontology-versioning mechanism exists today; the current filesystem `brain/` content has no
versioning, snapshotting, or rollback of any kind. This entire document describes target
architecture. Concrete MongoDB collections for ontology versions and migration/change records are
a Phase 3 design task (`09-implementation-roadmap.md`) and are intentionally not specified here.
