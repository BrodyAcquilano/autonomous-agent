# Agent Organization

## Purpose

This document describes the **Organizational Brain**: who may call whom, for what reason, and
under what limits. It is deliberately separate from the Execution Brain
(`01-execution-brain.md`) — this system answers "who may call whom for what, right now?", not
"how can this task be executed?"

## Resolved decision: delegated calling is the target architecture

An earlier version of this design had the server directly decide every transition between
agents (a fixed pipeline: server calls Agent A, receives its result, decides what happens next,
calls Agent B). **This is superseded as the end state**, though it remains a valid and simpler
starting point during early rollout (see `09-implementation-roadmap.md`).

The target architecture instead lets an agent decide *which authorized agent to call next and
why*:

```
Agent A
  | "call Agent B with Request Type X, here is why"
  v
Runtime / Server Kernel
  | validates: authorized edge? request type? payload? budget? depth? cycle? credentials?
  v
Agent B
```

The critical distinction is **who decides the next logical hop** (the agent) versus **who
enforces whether it's allowed** (the kernel). Agents gain more autonomy without the system
becoming a free-for-all: an agent can never call anything not explicitly authorized for it, and
the kernel remains the sole authority that actually executes side effects, injects credentials,
and writes to persistent state.

Because this is the target end state, **the database and runtime should anticipate this
infrastructure from the beginning**, even while agents initially have very few authorized edges.
Retrofitting call envelopes, budgets, and cycle protection later would be far more disruptive
than designing for them now and rolling out authority gradually.

## The directory as a structural graph

The organization is a directed, typed graph. Formally:

```
A = set of agents
R = set of request types
D_active ⊆ A × A × R
```

An element `(caller, callee, requestType) ∈ D_active` means the caller is currently authorized to
invoke the callee using that request type. This is a **sparse** relationship — most of the
theoretical `A × A × R` space is never populated, and only meaningful, deliberately-authorized
edges get records.

Each active edge has an associated contract describing:

- conditions under which the call is appropriate
- allowed input artifacts
- expected response types
- limits (e.g. max calls per task)
- status and version

A missing edge means the call is **not authorized** — semantic similarity or an agent's own
reasoning about what "should" be allowed can never substitute for an explicit directory entry.

## Agent profile

Every agent has a profile describing what it is and does: purpose, responsibilities, accepted
incoming request types, and the outputs/control signals it can produce. This is what makes the
organization self-describing rather than requiring hardcoded knowledge of every other role.

## Request types

A request type names *why* one agent is calling another (e.g. `REPLAN_TASK`,
`RESEARCH_ALTERNATE_ROUTE`, `SPECIFICATION_CONFLICT`, `DESIGN_DECISION_REQUIRED`). Each request
type has its own contract: required/optional inputs, expected outputs, and whether it is
terminal. `Caller → Callee` alone is not a meaningful relationship without the request type.

## Call envelope

A delegated call is a structured object, not a free-form message. Conceptually it carries:
caller identity, callee identity, request type, a stated reason, references to allowed artifacts
(never raw secrets), the expected response type(s), and call-chain metadata (depth, budget
state). The kernel validates the envelope against the active directory before the callee ever
receives it.

## Local phone book

An individual agent does not need — and should not receive — the entire directory. It receives
only its own outgoing subgraph: which callees and request types it is currently authorized to
use. This keeps agents effective without requiring global awareness of the organization, and
mirrors the progressive-loading principle from `00-overview.md`.

## Runtime kernel responsibilities

The kernel (server) is the sole enforcement authority. Regardless of how much logical autonomy
agents are given, the kernel always:

- validates that the edge and request type are authorized
- validates payload/artifact shape
- enforces budgets (token/cost) and concurrency limits
- enforces call-depth and repeated-edge/cycle limits (a feedback loop is a cycle in the active
  graph; cycles are useful but must have deterministic limits, not run unbounded)
- injects credentials and performs privileged operations (filesystem/database writes, external
  calls) — agents never hold raw secrets
- enforces human-approval gates where required
- records every call for audit and analytics (`07-analytics.md`)

## Progressive autonomy

Agents start with few or no authorized outgoing edges. Authority is added deliberately, edge by
edge, as the system proves each capability out — this applies to the project-execution roles in
`02-project-workflow.md` just as much as to the management roles in
`08-organizational-governance.md`. A staged rollout (fixed pipeline → limited delegated recovery
→ broader delegated collaboration) is expected and acceptable; see
`09-implementation-roadmap.md`.

## Relationship to the Execution Brain

The Execution Brain and the Organizational Brain both use sparse relationship tensors and the
same structural-filter-before-semantic-search principle, but they are **not the same system**
and must not be merged:

| | Execution Brain | Organizational Brain |
|---|---|---|
| Tensor | `Model × API × Tool` | `Agent × Agent × RequestType` |
| Answers | How can this be executed? | Who may call whom for what? |
| Consumed by | Router | Every agent, via its local phone book |

## Current repo state vs. target architecture

Nothing in the current runtime implements agent-to-agent calling, a directory, or a kernel
enforcement layer. `server/Runtime/Supervisor` and `server/Runtime/Worker` are empty scaffold
files and should not be assumed to implement any part of this. This layer is built as part of
the management organization phase (`09-implementation-roadmap.md`), before the project-execution
roles in `02-project-workflow.md` are implemented.
