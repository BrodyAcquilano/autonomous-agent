# Project Workflow

## Purpose

This document describes how a single user project request becomes finished, verified work,
through a small set of narrowly-scoped agent roles. It is the **execution organization** —
distinct from and built *after* the management organization (`08-organizational-governance.md`),
per the roadmap in `09-implementation-roadmap.md`.

## Roles

- **Project Coordinator** — operates at the project/feature level. Turns a user request into a
  set of required features, selects one feature at a time, and writes a feature brief (what
  should exist) and feature specification (how success will be judged).
- **Planner** — operates at the single-feature/task level. Converts one feature into a rolling
  implementation plan and forwards exactly one next task at a time.
- **Router** — translates one task into an execution route using the Execution Brain
  (`01-execution-brain.md`): required capabilities → model → API → tools → relationship
  documents → skill references.
- **Worker** — executes exactly one task using the approved route, using skills
  (`04-skills.md`) where applicable, and stages its output rather than writing directly to the
  authoritative project state.
- **Quality Control (QC)** — evaluates staged Worker output against the feature specification
  and the actual project state, and decides whether to approve it, ask for retry, or escalate.

## Core principles

- **Forward-only agents.** Each agent receives input, reasons, and produces one forward result.
  An agent does not need to know which agent ran before it, whether it will be invoked again, or
  how many times the overall workflow has looped. Looping behavior is created by the runtime
  re-invoking an agent with updated state, not by the agent's own control flow.
- **The project's real state is ground truth.** Agents should verify against the actual current
  project state rather than trusting only messages from earlier agents — this catches work that
  was already completed, completed differently than expected, or has since changed.
- **Plans are rolling state, not fixed schedules.** The Planner (and Coordinator, at the feature
  level) may cross off completed items, reorder, rewrite, or entirely replace the remaining plan
  at each invocation. Only the current `t-1 → t` transition is authoritative; nothing beyond the
  single next task/feature is treated as committed.
- **One task forwarded at a time.** The Planner never hands the Worker a large uncontrolled task
  list — only the single next task, with the rest persisted as the Planner's own future state.
- **Stage before commit.** Worker output is written to a staging area and only becomes
  authoritative project state after QC approves it.

## Outcome states

QC's evaluation resolves to one of:

- `APPROVE` — the staged work is acceptable; it is committed and the Planner is invoked for the
  next task.
- `RETRY` — the task is still correct but the implementation was insufficient; the Worker
  retries with QC's feedback.
- Escalation to a different role — see below.

The Planner resolves feature-level state to `FEATURE_COMPLETE` (returns control to the
Coordinator) or continues with the next task. The Coordinator resolves project-level state to
`PROJECT_COMPLETE` or selects the next feature.

## Feedback and escalation are delegated, not hardcoded

An earlier version of this design had the server hardcode every possible transition (e.g. "QC
reject always goes back to the Worker"). **This is superseded.** QC (and other roles) may
determine that the problem is not implementation quality but something else entirely — a bad
route, a bad task, a bad feature specification, or a genuine need for human judgment — and should
be able to escalate accordingly:

- Suspected route/model/tool problem → Maintenance (research an alternate route)
- Suspected bad task/decomposition → Planner (replan)
- Suspected bad feature specification → Project Coordinator (specification conflict)
- Requires human judgment → Human Review

These are not ad hoc: they are authorized calls through the Organizational Directory described
in `03-agent-organization.md`, which is what actually validates and enforces whether a given
escalation is currently allowed, budgeted, and within cycle limits. This document defines *why*
an escalation might be needed; `03-agent-organization.md` defines *how* it is authorized and
executed.

## Current repo state vs. target architecture

None of this workflow exists in the current runtime. `server/Runtime/Supervisor`,
`server/Runtime/Worker`, `server/Runtime/State/RunMachine.js`, and
`server/Runtime/State/createRunState.js` are empty scaffold files with no implementation. The
current Console page performs a single direct call from the user to a fixed router model with no
Planner, Router, Worker, or QC involved. This workflow is explicitly the **last** layer to be
built, after the management organization exists (see `09-implementation-roadmap.md`) — do not
implement it prematurely.
