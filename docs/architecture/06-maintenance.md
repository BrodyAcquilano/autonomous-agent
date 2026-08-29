# Maintenance

## Purpose

The Maintenance Agent keeps the **Execution Brain's** infrastructure knowledge current and
healthy: models, APIs, providers, deployments, capabilities, and their relationship documents.
It does not manage organizational design (that is HR — see `08-organizational-governance.md`)
and does not manage skills content (`04-skills.md`), beyond flagging when a skill references
something Maintenance has deprecated.

## Initial (v1) scope

The mature Maintenance role described below is the target; its first implementation can be much
smaller: running on a timer/cron, inspecting a small set of configured records, checking
configured resources against expectations, applying only already-approved maintenance policies,
and creating tickets. It does not need sophisticated research or fully generalized
backup/rollback machinery on day one — capability grows over time, per the staged-capability
principle in `00-overview.md`.

## Resolved default policy

For modifications or removals of **existing** configuration or brain records, Maintenance
defaults to **Automatic With Rollback**:

1. snapshot/back up the affected state
2. apply the update, deprecation, or removal
3. create a Maintenance review ticket describing what changed and why
4. notify the human when appropriate
5. retain the ability to restore the previous state if the change is rejected

Example: Maintenance determines that an API/model relationship is obsolete, backs it up,
deprecates it, and reports the change afterward — it does not need to wait for approval to make
that specific class of change, because it is reversible and bounded to existing, already-active
configuration.

**Adding new external capability is different and always requires human approval first.**
Maintenance cannot independently create or acquire:

- new API credentials
- new provider accounts
- new paid services
- new Microsoft Foundry deployments
- new external permissions
- secret values
- any other capability expansion requiring human authority

For these, Maintenance's role is limited to identifying the need, drafting what would be
required (entity docs, relationship docs, configuration requirements), and creating a request for
Brody to configure and approve. This mirrors the human-authority principle in `00-overview.md`.

## Scope

- Models, APIs, providers, deployments, capabilities
- Relationship documents in the Execution Brain
- Detecting deprecated/broken routes and researching alternatives (including acting as an
  infrastructure researcher when called by another agent — e.g. Quality Control, per
  `02-project-workflow.md` and `03-agent-organization.md` — after a route repeatedly fails)

Out of scope: organizational roles/topology (HR/CEO), skill content quality, project source code.

## Tickets and backups

Every meaningful Maintenance action or proposal produces a ticket recording: what was found, why
it matters, evidence, affected entities/files/records, the before/after change, backup
reference, and whether human approval is required. Backups are immutable during their retention
period and must restore both the affected files and any corresponding database state together,
so the two never fall out of sync.

Email/notification is an alert channel only — it links back to the ticket, but the review
interface (a future Maintenance page, per `09-implementation-roadmap.md`) remains the
authoritative place decisions are actually recorded.

## Current repo state vs. target architecture

No Maintenance agent, ticketing, or backup mechanism exists today. This is target architecture,
built as part of the management-organization phase, before the project-execution roles in
`02-project-workflow.md`. Concrete MongoDB collections for tickets and backups are a Phase 3
design task and intentionally not specified here.
