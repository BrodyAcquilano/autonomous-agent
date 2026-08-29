# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start both the backend (`nodemon server/server.js`) and frontend (`vite`) concurrently. This is the normal way to develop.
- `npm run server` — run only the Express backend (with nodemon, port from `.env` `PORT`, default 3000).
- `npm run client` — run only the Vite dev server. It proxies `/api/*` to `http://localhost:3000` (see `vite.config.js`), so the backend must be running separately for API calls to work.
- `npm run build` — production build via Vite.
- `npm run preview` — preview the production build.
- `npm run lint` — run ESLint (flat config in `eslint.config.js`, JS/JSX only, React Hooks + React Refresh rules).

There is no test suite/framework configured in this repository (no test files, no test script beyond the placeholder `script.js` entry in `package.json`).

## Architecture

This is an "autonomous agent" console app: a React (v19) + Vite frontend backed by an Express (v5) server that proxies requests to **Azure OpenAI's Responses API** (not OpenAI directly, and not the standard Chat Completions API).

### Backend structure (`server/`)

- `server.js` is the entrypoint. It mounts four route groups under `/api`: `/api/models`, `/api/apis`, `/api/azure/openai-responses`, `/api/azure/openai-images`.
- Backend code follows a **Routes/Services split**: `Routes/*` handle HTTP concerns (multipart parsing via `multer`, request validation, status codes, SSE streaming), and `Services/*` hold the actual Azure SDK calls. This split is consistent across both Azure integrations (`Routes/Azure/OpenAIResponses.js` + `Services/Azure/OpenAIResponses.js`, and the equivalent for `OpenAIImages`).
- **Model-name indirection**: the app never sends a raw Azure deployment name from the frontend. It uses app-level model IDs (e.g. `"gpt-5.6-terra"`, `"gpt-5.3-codex"`), and `getAzureConfig()` in `server/Services/Azure/OpenAIResponses.js` maps that ID to a real deployment name via env vars (e.g. `AZURE_OPENAI_GPT_56_TERRA_DEPLOYMENT_NAME`). **To add a new model, add its env var and a new `case` in that switch statement** — there's no dynamic/config-driven lookup.
- `server/Routes/Models/models.js` and `server/Routes/Apis/apis.js` are a **filesystem-as-CMS** pattern: they read markdown files directly off disk at request time (`brain/models/*.md`, `brain/apis/**/*.md`) and serve them as JSON to populate the frontend's Models/Resources pages. There is no database.
- `server/Runtime/` (`Supervisor.js`, `Worker.js`, `State/RunMachine.js`, `State/createRunState.js`, `Memory/MemoryService.js`, `Memory/LocalMemory.js`) and `server/Services/Files/FileService.js` are **currently empty (0-byte) scaffold files**. They represent a planned multi-step/agentic execution + memory subsystem that has not been implemented yet — do not assume any behavior from these paths exists today.
- `cors` is an installed dependency but is **not** wired up in `server.js`. This works today only because Vite's dev proxy keeps frontend/backend same-origin; it would need to be added if the frontend is ever served from a different origin.

### Frontend structure (`src/`)

- Routing is page-based via `react-router` (`App.jsx`), with routes: `/console`, `/output`, `/models`, `/resources`, `/memory`, `/analytics` (root and unknown paths redirect to `/console`).
- **Centralized state**: nearly all cross-page state (chat messages, current model response, extracted output files, widget drag/resize positions, viewport camera state, system status) lives in one hook, `src/Runtime/Runtime.jsx` (`useRuntime()`), and is prop-drilled from `App.jsx` into pages. There is no context/Redux/Zustand store.
- `src/Api/` mirrors the backend route structure 1:1 (`Api/Azure/OpenAIResponses.js`, `Api/Azure/OpenAIImages.js`, `Api/Apis/apis.js`, `Api/Models/models.js`), all built on a shared axios instance (`Api/axios.js`, baseURL `/api`).
- **Console page** (`Pages/Console/`) is the primary interaction surface: it sends prompts (plus optional image/PDF attachments) through the backend to Azure Responses API using a fixed router model ID (`ROUTER_MODEL_ID = "gpt-5.6-terra"` in `Console.jsx`). Request options (reasoning effort/mode, verbosity, max tokens, and optional tools — image generation, code interpreter, web search) are edited via the `RequestControlPanel` widget and stored in `requestSettings` from `useRuntime()`.
- **Output page** (`Pages/Output/`) renders the response: `Runtime.jsx` extracts generated images, code-interpreter container files, and text output from the raw Azure response (`extractResponseFiles`) and hands them to `Output` as a list of "windows" placed on a pannable/zoomable virtual canvas, each rendered by a type-specific renderer under `Pages/Output/Renderers/` (Code/Image/Markdown/Pdf/Text/Unknown).
- **Widget offset/size persistence convention**: draggable/resizable panels (Console widgets, Output windows) store `{x, y}` / `{width, height}` keyed by widget name/ID in `Runtime.jsx` state. A `null` value means "never manually arranged — let the page compute a default layout position," while a non-null value means the user has explicitly moved/resized it and that should be preserved. This convention is used identically for both Console and Output pages and must be respected when adding new widgets.
- `Pages/Memory/` and `Pages/Analytics/` are currently placeholder stub pages ("MODULE AWAITING CONFIGURATION"), matching the empty backend Memory runtime files.

### The `brain/` directory

`brain/` is a content store read live off disk by the backend, not just documentation:
- `brain/models/*.md` and `brain/apis/**/*.md` are populated and actively served by `server/Routes/Models` and `server/Routes/Apis` to the frontend.
- `brain/commands/commands.md`, `brain/skills/skills.md`, `brain/tools/tools.md` are currently empty, and `brain/memory/`, `brain/tasks/` are empty directories — placeholders for planned agent capabilities (commands, skills, tools, persistent memory/tasks) referenced by the project's overall design but not yet built.

### Environment

Configuration lives in `.env` (not committed structure documented here, but present locally): `PORT`, `FOUNDRY_PROJECT_ENDPOINT`, `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, and one `AZURE_OPENAI_*_DEPLOYMENT_NAME` var per supported model. `@azure/ai-projects` and `@azure/identity` are installed dependencies (Azure AI Foundry) but no code currently reads `FOUNDRY_PROJECT_ENDPOINT` — likely reserved for planned features.
