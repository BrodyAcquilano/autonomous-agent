# GPT-5.3 Codex

## Identity

**Model name:** GPT-5.3 Codex

**Model ID:** `gpt-5.3-codex`

**Model version:** `2026-02-24`

**Provider:** OpenAI

**Service:** Azure OpenAI

**Platform:** Microsoft Foundry

**Hosted on:** Azure

**Lifecycle:** Generally Available

**Training cutoff:** August 2025

**Retirement date:** 2027-08-23

---

## Description

GPT-5.3 Codex is a reasoning model specialized for software development and coding workflows.

It is designed for steerability, front-end development, interactivity, repository-aware reasoning, code review, refactoring, testing, and longer-running development tasks.

The model can reason across text, source code, screenshots, user interfaces, architecture diagrams, and other image inputs within software-development workflows.

---

## APIs

**Primary API:** Responses API

**Additional API:** Not listed

### Azure OpenAI Base URL

Environment variable:

`AZURE_OPENAI_BASE_URL`

The configured base URL includes the Azure OpenAI v1 path:

`/openai/v1/`

Responses are created with the OpenAI SDK using:

`client.responses.create()`

The Azure OpenAI v1 API uses implicit API versioning.

No `api-version` environment variable is required for OpenAI-compatible v1 Responses API requests.

The deployment name is supplied as the `model` field in requests.

### Foundry Project Endpoint

Environment variable:

`FOUNDRY_PROJECT_ENDPOINT`

The Foundry project endpoint can expose the Responses API through:

`{FOUNDRY_PROJECT_ENDPOINT}/openai/v1/responses`

The project endpoint can additionally provide access to Foundry project-scoped data, tools, tracing, monitoring, and agent capabilities.

---

## Environment Variables

Secrets and endpoint values are stored in the application's `.env` file.

This document stores environment-variable names only.

### Azure OpenAI

**Base URL**

`AZURE_OPENAI_BASE_URL`

**API key**

`AZURE_OPENAI_API_KEY`

**Deployment name**

`AZURE_OPENAI_GPT_53_CODEX_DEPLOYMENT_NAME`

Expected deployment:

`gpt-5.3-codex`

### Microsoft Foundry

**Project endpoint**

`FOUNDRY_PROJECT_ENDPOINT`

---

## Input and Output

### Native Input Modalities

- Text
- Image

### Responses API Inputs

- Text
- Image
- PDF file input

PDF files can be supplied through the Responses API to supported vision-capable models.

For PDF input, Azure can include extracted document text and rendered page images in model context.

Other local file types can be read by application code and supplied as text, or accessed through appropriate file and retrieval tools.

### Output

- Text

---

## Context

**Context window:** 400,000 tokens

**Maximum input:** 272,000 tokens

**Maximum output:** 128,000 tokens

---

## Core Capabilities

- Reasoning
- Software development
- Front-end development
- Repository-aware code understanding
- Context-aware code review
- Long-running development workflows
- Structured output
- Function calling
- Tool calling
- Parallel tool calling
- Image processing
- Multimodal reasoning
- Refactoring
- Test generation and automation

---

## Reasoning

GPT-5.3 Codex is a reasoning model optimized for software-development workloads.

It is designed to maintain context across complex coding tasks and reason across repositories, source code, screenshots, user-interface states, architecture diagrams, and related development artifacts.

The model is particularly suited to workflows requiring coordinated code changes, debugging, code review, refactoring, testing, and iterative development.

---

## Key Use Cases

- Code generation
- Front-end development
- Repository analysis
- Code review
- Debugging
- Refactoring
- Test generation
- Test automation
- UI implementation
- Architecture analysis
- Long-running coding tasks
- Multimodal software-development workflows

---

## Foundry Tools

When used through Microsoft Foundry and appropriately configured, the model can participate in workflows using supported platform tools including:

- Code Interpreter
- Azure AI Search
- SharePoint
- Fabric Data Agent
- OpenAPI
- Agent-to-Agent
- Browser Automation
- File Search
- Web Search
- Model Context Protocol
- Grounding with Bing Search
- Grounding with Bing Custom Search
- Work IQ
- Fabric IQ
- Memory Search

Tool support does not mean a tool is automatically enabled.

Tool availability depends on the API, application, agent, project, permissions, and Foundry configuration.

---

## Deployment

**Deployment name:** `gpt-5.3-codex`

**Deployment type:** GlobalStandard

**Provisioning state:** Succeeded

**Version upgrade policy:** OnceNewDefaultVersionAvailable

**Model version:** `2026-02-24`

**Guardrails:** DefaultV2

### Rate Limits

**Tokens per minute:** 500,000

**Requests per minute:** 5,000

These limits describe this specific Azure deployment.

They are not inherent limits of the GPT-5.3 Codex model.

---

## Pricing

Pricing depends on deployment type, region, token usage, caching, and Azure agreement.

Fixed pricing values are intentionally not stored in this model definition because pricing can change.

Current pricing should be checked using Microsoft's official Azure OpenAI pricing documentation.

[Azure OpenAI pricing](https://aka.ms/AzureOAIpricing)