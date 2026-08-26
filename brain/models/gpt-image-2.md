# GPT-Image-2

## Identity

**Model name:** GPT-Image-2

**Model ID:** `gpt-image-2`

**Model version:** `2026-04-21`

**Provider:** OpenAI

**Service:** Azure OpenAI

**Platform:** Microsoft Foundry

**Hosted on:** Azure

**Lifecycle:** Generally Available

**Training cutoff:** Not published

**Retirement date:** 2027-10-20

---

## Description

GPT-Image-2 is an image-generation and image-editing model designed for high-quality visual creation from text and image inputs.

It supports text-to-image generation, image-to-image generation, image editing, inpainting, flexible aspect ratios and resolutions, and improved preservation of existing image characteristics such as faces and other retained visual elements.

Key use cases include visual design, product imagery, marketing assets, social media graphics, image editing, concept visualization, and other workflows requiring generated or modified images.

---

## APIs

**Primary API:** Images API

**Additional API:** Responses API image-generation tool

### Azure OpenAI Base URL

Environment variable:

`AZURE_OPENAI_BASE_URL`

The configured Azure OpenAI base URL includes:

`/openai/v1/`

Direct image generation uses the image-generation route:

`/openai/v1/images/generations`

Current Azure documentation uses:

`api-version=preview`

Image-generation requests can be made through the OpenAI SDK using image-generation operations.

GPT image deployments can also be exposed to compatible Responses API models through the `image_generation` tool.

### Foundry Project Endpoint

Environment variable:

`FOUNDRY_PROJECT_ENDPOINT`

The Foundry project endpoint may be used for project-scoped workflows involving image generation and other Foundry capabilities.

Image generation may also be invoked as a tool from compatible Responses API workflows when the image-generation deployment is appropriately configured.

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

`AZURE_OPENAI_GPT_IMAGE_2_DEPLOYMENT_NAME`

Expected deployment:

`gpt-image-2`

### Microsoft Foundry

**Project endpoint**

`FOUNDRY_PROJECT_ENDPOINT`

---

## Input and Output

### Native Input Modalities

- Text
- Image

### Responses API Inputs

When configured as an image-generation tool within a compatible Responses API workflow, the image deployment can receive image-generation instructions through that workflow.

Direct image-generation and image-editing operations can receive:

- Text prompts
- Image inputs

### Output

- Image

---

## Context

**Context window:** Not published

**Maximum input:** Not published

**Maximum output:** Image output is governed by image-resolution limits rather than text-token output limits.

Supported image sizes must satisfy the model's image-generation constraints, including:

- Maximum edge length below 3840 pixels
- Width and height divisible by 16
- Maximum aspect ratio of 3:1
- Maximum total image size of 8,294,400 pixels
- Minimum total image size of 655,360 pixels

---

## Core Capabilities

- Text-to-image generation
- Image-to-image generation
- Image editing
- Inpainting
- High-quality image generation
- Flexible aspect ratios
- Flexible image resolutions
- Face preservation
- High input fidelity
- Preservation of retained image elements
- Targeted image modifications

---

## Reasoning

GPT-Image-2 is specialized for visual generation and editing rather than general-purpose text reasoning.

The model interprets text and image inputs to create or modify visual output while attempting to preserve requested image characteristics and follow spatial, stylistic, and editing instructions.

It is designed for image-generation workflows where visual quality, editing control, retained image details, and flexible output dimensions are important.

---

## Key Use Cases

- Image generation
- Image editing
- Product imagery
- Marketing visuals
- Social media graphics
- Concept visualization
- Design exploration
- Image-to-image transformation
- Inpainting
- Targeted visual modifications

---

## Foundry Tools

GPT-Image-2 is primarily an image-generation model rather than a general-purpose agent reasoning model.

A Foundry Agent Service tool list equivalent to the one published for GPT-5.3 Codex is not listed for this model.

Instead, GPT-Image-2 can itself be used as an image-generation capability through the Images API or as an image-generation tool within compatible Responses API workflows.

Tool availability depends on the API, application, agent, project, permissions, and Foundry configuration.

---

## Deployment

**Deployment name:** `gpt-image-2`

**Deployment type:** GlobalStandard

**Provisioning state:** Succeeded

**Version upgrade policy:** OnceNewDefaultVersionAvailable

**Model version:** `2026-04-21`

**Guardrails:** DefaultV2

### Rate Limits

**Requests per minute:** 2

A token-per-minute limit is not listed for this image deployment.

These limits describe this specific Azure deployment.

They are not inherent limits of the GPT-Image-2 model.

---

## Pricing

Pricing depends on deployment type, region, input usage, output image characteristics, and Azure agreement.

Fixed pricing values are intentionally not stored in this model definition because pricing can change.

Current pricing should be checked using Microsoft's official Azure OpenAI pricing documentation.

[Azure OpenAI pricing](https://aka.ms/AzureOAIpricing)