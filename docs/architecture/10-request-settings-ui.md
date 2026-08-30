# Request Settings UI

## Purpose

This document covers the frontend surface that lets a human supply advisory defaults into the
Router — currently the `SuggestedRequestSettingsPanel` on the Console page — and how it should
evolve as the Capabilities Brain (`01-capabilities-brain.md`) grows more varied. It is
deliberately separate from `01-capabilities-brain.md` itself: that document is about the routing
logic and the funnel's data model; this one is about the *UI surface that feeds into it*, which
has its own limitations worth tracking on their own.

## Current state (v1): one fixed panel for every request

`src/Pages/Console/Components/SuggestedRequestSettingsPanel/` presents a single, fixed set of
controls regardless of which model or API a task will actually be routed to: a reasoning
effort/mode dropdown, a verbosity dropdown, a max-output-tokens field, and three hardcoded tool
toggles (`image_generation`, `code_interpreter`, `web_search`) with their own parameters (image
size/quality for `image_generation`). This whole object is attached to every one of the Router's
stage calls as `suggested-request-settings.json`, explicitly framed in the Router's own prompt as
advisory — a candidate the Router may deviate from based on the task and what the Capabilities
Brain actually contains, never a binding instruction (see `01-capabilities-brain.md` and the
`agents.router` profile document for exactly how this is worded).

This works today specifically because the seeded Capabilities Brain is small and homogeneous:
exactly three models (`gpt-5.6-terra`, `gpt-5.3-codex`, `gpt-image-2`), all on the same platform
(Azure OpenAI Foundry), all speaking a similar OpenAI-shaped request surface (`reasoning`,
`text.verbosity`, `max_output_tokens`, a `tools` array). One fixed panel of "ChatGPT/Azure-style"
settings can meaningfully apply to all of them at once. **This is a coincidence of the current
seed data, not a property of the design** — it stops being true the moment a materially different
model, provider, or tool shape enters the catalog (a non-reasoning model, a non-OpenAI provider, a
tool whose parameters don't resemble image size/quality at all).

## Known limitation

The panel's tool list and each tool's parameters are hardcoded directly in the component
(`IMAGE_QUALITIES`, `IMAGE_SIZES`, and one JSX block per tool) rather than derived from the
`tools`/`capabilities` collections the way the Capabilities page already browses them live. In
practice this means:

- A newly added tool never appears in this panel until someone manually writes a matching block
  into the component — the panel does not discover tools the way the Router itself does.
- The panel has no concept of "this suggestion only makes sense if the Router happens to pick
  model X and API Y" — it is really one global bag of settings sent identically on every request,
  independent of the task or of what the Router will end up choosing.

## Target direction: a form that walks the Capabilities Brain funnel

The better long-term shape, once the catalog has enough real variety to justify the complexity: a
form that mirrors the Model → API → Tool → Capability funnel directly (`01-capabilities-brain.md`)
— pick a suggested model, see the APIs actually scoped to it, see the tools actually scoped to
that model+API pair (read live from the `tools`/`capabilities` collections), and configure only
the parameters that specific tool actually supports. This generalizes what the panel does today
(which only works because all three current models happen to share a similar shape) into
something that stays correct as the Capabilities Brain grows more varied, without needing a
person to keep a hardcoded frontend component in sync with the database by hand every time a
model, API, or tool is added.

## Further-future direction: an optional direct-call bypass

Once that form exists, a natural extension is an explicit "override the Router" mode: instead of
sending the form's picks to the Router as suggestions, skip the Router/Temp Worker pipeline
entirely for that one request and call a single general-purpose execution route directly with the
exact model/API/tool configuration chosen in the form — closer to how the original single-shot
Azure Responses/Images proxy worked before the Router existed (`00-overview.md`,
`09-implementation-roadmap.md`). This would sit *alongside*, not replace, the advisory-suggestion
model described above: most requests would still go through the Router's own reasoning; this
would be an explicit escape hatch for a user who already knows exactly which model/API/tool
combination they want and would rather not pay for — or risk — the Router re-deciding it.

## Relationship to the Router's suggestion model

None of this changes the advisory nature described in `01-capabilities-brain.md`: even a form that
lets the user pick a specific model/API/tool combination directly would still, in its normal
"suggestion" mode, be handed to the Router as a candidate it may deviate from, not a directive. The
direct-call bypass above is the only mode where a user's configuration would actually be binding,
and that is a deliberately separate, explicitly-chosen path rather than the default.

## Status

Not implemented. The current panel (v1, described above) is intentionally left as-is for now —
revisit once the Capabilities Brain has enough real model/API/tool variety that the current
one-size-fits-all panel starts producing suggestions that are actually confusing or wrong for a
given model/API pair, rather than just structurally coincidental.
