# GPT-5.6 Terra

## Identity

**Model name:** GPT-5.6 Terra

**Model ID:** `gpt-5.6-terra`

**Model version:** `2026-07-09`

**Provider:** OpenAI

**Service:** Azure OpenAI

**Platform:** Microsoft Foundry

**Hosted on:** Azure

**Lifecycle:** Generally Available

**Training cutoff:** 2026-06-17

**Retirement date:** 2028-01-10

---

## Description

GPT-5.6 Terra is a balanced reasoning model in the GPT-5.6 family.

It is designed to provide strong reasoning and tool-use capabilities while balancing performance, scalability, and cost.

Key use cases include business automation, knowledge retrieval, document analysis, workflow orchestration, agentic assistance, operational decision support, research, and other workloads requiring strong reasoning at scale.

---

## APIs

**Primary API:** Responses API

**Additional API:** Chat Completions API

### Azure OpenAI Base URL

Environment variable:

`AZURE_OPENAI_BASE_URL`

The configured base URL includes the Azure OpenAI v1 path:

`/openai/v1/`

Responses are created with the OpenAI SDK using:

`client.responses.create()`

The Azure OpenAI v1 API uses implicit API versioning.

No `api-version` environment variable is required for OpenAI-compatible v1 requests.

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

`AZURE_OPENAI_DEPLOYMENT_NAME`

Expected deployment:

`gpt-5.6-terra`

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

**Context window:** 1,050,000 tokens

**Maximum output:** 128,000 tokens

---

## Core Capabilities

- Reasoning
- Long-context understanding
- Structured output
- Function calling
- Tool calling
- Parallel tool calling
- Image processing
- Computer use
- Workflow execution
- Agentic workflows
- Large-document analysis

---

## Reasoning

GPT-5.6 Terra supports configurable reasoning effort.

Increasing reasoning effort can trade additional latency and token usage for deeper reasoning.

The model is designed to balance reasoning capability, scalability, efficiency, and cost.

---

## Key Use Cases

- Business automation
- Knowledge retrieval
- Document analysis
- Workflow orchestration
- Agentic assistance
- Operational decision support
- Research
- Tool-based workflows
- Long-context analysis
- General reasoning

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

**Deployment name:** `gpt-5.6-terra`

**Deployment type:** GlobalStandard

**Provisioning state:** Succeeded

**Version upgrade policy:** OnceNewDefaultVersionAvailable

**Model version:** `2026-07-09`

**Guardrails:** DefaultV2

### Rate Limits

**Tokens per minute:** 250,000

**Requests per minute:** 250

These limits describe this specific Azure deployment.

They are not inherent limits of the GPT-5.6 Terra model.

---

## Pricing

Pricing depends on deployment type, region, token usage, caching, and Azure agreement.

Fixed pricing values are intentionally not stored in this model definition because pricing can change.

Current pricing should be checked using Microsoft's official Azure OpenAI pricing documentation.

[Azure OpenAI pricing](https://aka.ms/AzureOAIpricing)