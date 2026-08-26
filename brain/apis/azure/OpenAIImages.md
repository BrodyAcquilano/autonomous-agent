# OpenAI Images API

## Identity

**API name:** OpenAI Images API

**Provider:** OpenAI

**Service:** Azure OpenAI

**Platform:** Microsoft Foundry

**Hosted on:** Azure

**Client library:** `openai`

**JavaScript generation method:** `client.images.generate()`

**Protocol:** HTTPS

---

## Description

The OpenAI Images API provides image-generation and image-editing capabilities.

Depending on the selected model and operation, capabilities can include:

- Text-to-image generation
- Image-to-image generation
- Image editing
- Inpainting
- Transparent backgrounds
- Flexible image dimensions
- Multiple generated images
- Streaming partial images

Azure OpenAI provides Azure-hosted access to supported GPT image models.

---

## Azure Configuration

### Base URL

Azure OpenAI v1 base endpoint:

`https://<resource>/openai/v1/`

Image-generation endpoint:

`https://<resource>/openai/v1/images/generations`

---

### Authentication

Azure OpenAI supports API-key authentication and supported Azure identity authentication methods.

For API-key authentication, the request uses an Azure OpenAI API key associated with the Azure resource.

---

### Deployment

The `model` request parameter identifies the Azure image-model deployment.

For example:

`gpt-image-2`

---

### API Version

Azure currently exposes GPT image generation through:

`/openai/v1/images/generations?api-version=preview`

The preview API-version query applies to the current Azure GPT image-generation v1 endpoint.

---

## Azure-Specific Behavior

Azure OpenAI adds platform-level controls including:

- Azure authentication
- Azure model deployments
- Resource permissions
- Requests-per-minute quotas
- Deployment limits
- Azure AI Content Safety
- Image safety systems
- Deployment guardrails
- Microsoft Foundry monitoring

These controls surround the Images API but do not create a separate nested Azure request or response object.

---

# Request

## Request Parameters

Image-generation request parameters include:

- `model`
- `prompt`
- `size`
- `n`
- `quality`
- `output_format`
- `background`
- `output_compression`
- `user`
- `stream`
- `partial_images`

Support for individual parameters can depend on the selected image model.

---

## Request Structure

The following structure shows the major image-generation request parameters.

```json
{
  "model": "<deployment-name>",

  "prompt": "<image-generation-prompt>",

  "size": "1024x1024",

  "n": 1,

  "quality": "high",

  "output_format": "png",

  "background": "auto",

  "output_compression": 100,

  "user": "<optional-user-identifier>",

  "stream": false,

  "partial_images": 0
}
```

Only parameters required by a particular request need to be supplied.

---

# Request Parameter Reference

## `model`

**Type:** string

**Required:** yes

Identifies the Azure image-model deployment.

Example deployment:

`gpt-image-2`

---

## `prompt`

**Type:** string

**Required:** yes

Contains the image-generation instruction.

The prompt describes what the generated image should contain.

It can specify characteristics including:

- Subject
- Composition
- Style
- Lighting
- Environment
- Perspective
- Visual details
- Text content
- Design requirements

---

## `size`

**Type:** string

**Required:** no

Controls generated image dimensions.

Standard GPT image sizes include:

- `1024x1024`
- `1536x1024`
- `1024x1536`

GPT-Image-2 additionally supports arbitrary resolutions subject to Azure's current constraints.

Current GPT-Image-2 constraints include:

- Width must be divisible by 16
- Height must be divisible by 16
- Long edge up to 3840 pixels
- Aspect ratio no greater than 3:1
- Total pixel count at least 655,360
- Total pixel count no greater than 8,294,400

The value:

`auto`

can allow the service to choose dimensions where supported.

---

## `n`

**Type:** integer

**Required:** no

**Default:** `1`

Controls the number of generated images.

Current Azure GPT image generation supports:

`1`

through:

`10`

images in one request.

---

## `quality`

**Type:** string

**Required:** no

Controls image-generation quality.

Values:

- `low`
- `medium`
- `high`

Current Azure documentation uses:

`high`

as the default for GPT image generation.

Lower quality generally produces images faster.

---

## `output_format`

**Type:** string

**Required:** no

Controls generated image format.

Azure currently supports:

- `png`
- `jpeg`

Default:

`png`

WEBP output is not currently supported by the Azure OpenAI image-generation endpoint.

---

## `background`

**Type:** string

**Required:** no

Controls generated background behavior.

Supported values can include:

- `auto`
- `transparent`

Transparent output requires an image format that supports transparency.

PNG is used for transparent output.

---

## `output_compression`

**Type:** integer

**Required:** no

Controls image compression.

Range:

`0`

through:

`100`

Default:

`100`

This parameter is primarily relevant to compressed formats such as JPEG.

---

## `user`

**Type:** string

**Required:** no

Optional identifier associated with the requesting user.

It can be used for monitoring and usage attribution.

---

## `stream`

**Type:** boolean

**Required:** no

**Default:** `false`

Enables streamed image-generation events.

When streaming is enabled, partial image data can be returned before the final image is complete.

---

## `partial_images`

**Type:** integer

**Required:** no

Controls the number of partial image previews generated during streaming.

Current supported range:

- `0`
- `1`
- `2`
- `3`

This parameter is relevant when:

`stream`

is:

`true`

---

# Response

## Response Parameters

A normal non-streaming generation response contains:

- `created`
- `data`

Each entry in `data` can contain:

- `b64_json`

Streaming responses use image-generation events with additional fields.

---

## Response Structure

A normal non-streaming image-generation response has a structure similar to:

```json
{
  "created": 1234567890,

  "data": [
    {
      "b64_json": "<BASE64_IMAGE_DATA>"
    }
  ]
}
```

For multiple generated images, the `data` array contains multiple image-result objects.

---

# Response Parameter Reference

## `created`

**Type:** timestamp

Indicates when the image-generation response was created.

---

## `data`

**Type:** array

Contains the generated image results.

The number of results corresponds to the number of successfully generated images.

---

### `data[].b64_json`

**Type:** string

Contains generated image bytes encoded as base64 data.

The decoded bytes represent the requested output format.

For example:

- PNG
- JPEG

---

# Streaming Response

When streaming is enabled, the API can emit partial image events before the completed image.

Streaming event fields can include:

- `type`
- `b64_json`
- `created_at`
- `partial_image_index`
- `size`
- `quality`
- `background`
- `output_format`

---

## `type`

Identifies the streaming event type.

Partial image events use:

`image_generation.partial_image`

Completed generation events use:

`image_generation.completed`

---

## `b64_json`

Contains base64-encoded image data for the current streaming event.

---

## `partial_image_index`

Identifies the intermediate image preview.

---

## `created_at`

Indicates when the streaming event was created.

---

## `size`

Reports the generated image dimensions.

---

## `quality`

Reports the image quality setting.

---

## `background`

Reports the background setting.

---

## `output_format`

Reports the generated output format.

---

## Streaming Usage

Completed GPT image streaming events can include token-usage information.

Usage fields can include:

- `input_tokens`
- `input_tokens_details`
- `output_tokens`
- `total_tokens`

Input-token details can include:

- `text_tokens`
- `image_tokens`

---

# Image Editing

The Images API also supports image-editing operations for compatible GPT image models.

Image-editing inputs can include:

- Source image
- Text prompt
- Mask
- Size
- Quality
- Output format
- Background settings

Editing requests use the image-editing operation rather than the normal image-generation operation.

The request format differs from simple image generation because image files can be supplied directly with the editing request.

---

# Azure Errors and Content Filtering

Azure OpenAI can reject an image request because of conditions including:

- Invalid authentication
- Invalid deployment
- Rate-limit exhaustion
- Deployment quota exhaustion
- Invalid dimensions
- Invalid output format
- Invalid parameter values
- Azure AI Content Safety
- Image safety systems
- Resource permissions
- Service availability

When content filtering blocks image generation, a generated image is not returned.

---

# Examples

## Basic Image Generation

```js
const response =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "A futuristic city at night.",
  });
```

---

## Sized Image Generation

```js
const response =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "A detailed ecological monitoring station in a boreal forest.",

    size:
      "1536x1024",

    quality:
      "high",
  });
```

---

## Multiple Images

```js
const response =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "Concept art for a modern environmental research laboratory.",

    n:
      4,

    size:
      "1024x1024",

    quality:
      "medium",
  });
```

---

## PNG Output

```js
const response =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "A clean technical illustration of a weather monitoring station.",

    output_format:
      "png",

    quality:
      "high",
  });
```

---

## Transparent Background

```js
const response =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "A clean isolated icon of an environmental sensor.",

    background:
      "transparent",

    output_format:
      "png",
  });
```

---

## Streaming Image Generation

```js
const stream =
  await client.images.generate({
    model:
      "gpt-image-2",

    prompt:
      "A detailed futuristic landscape.",

    stream:
      true,

    partial_images:
      2,
  });
```