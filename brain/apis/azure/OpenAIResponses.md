# OpenAI Responses API

## Identity

**API name:** OpenAI Responses API

**Provider:** OpenAI

**Service:** Azure OpenAI

**Platform:** Microsoft Foundry

**Hosted on:** Azure

**Client library:** `openai`

**JavaScript method:** `client.responses.create()`

**Protocol:** HTTPS

---

## Description

The OpenAI Responses API provides a unified interface for model inference.

Depending on the selected model, it can support:

- Text input
- Image input
- File input
- Text output
- Reasoning
- Structured output
- Function calling
- Tool calling
- Parallel tool calling
- Conversation continuation
- Streaming
- Background execution

Azure OpenAI exposes the Responses API through an OpenAI-compatible v1 interface.

---

## Azure Configuration

### Base URL

Azure OpenAI v1 endpoint:

`https://<resource>/openai/v1/`

Responses endpoint:

`https://<resource>/openai/v1/responses`

---

### Authentication

Azure OpenAI supports API-key authentication and supported Azure identity authentication methods.

For API-key authentication, the request uses an Azure OpenAI API key associated with the Azure resource.

---

### Deployment

The `model` request parameter identifies the Azure model deployment.

The deployment name does not have to be different from the underlying model ID.

For example, an Azure deployment can be named:

`gpt-5.6-terra`

---

### API Version

The Azure OpenAI v1 Responses API uses the OpenAI-compatible v1 endpoint.

Normal v1 Responses requests do not require an `api-version` query parameter.

---

## Azure-Specific Behavior

Azure OpenAI adds platform-level controls including:

- Azure authentication
- Azure model deployments
- Resource permissions
- Deployment quotas
- Tokens-per-minute limits
- Requests-per-minute limits
- Azure AI Content Safety
- Deployment guardrails
- Microsoft Foundry monitoring
- Microsoft Foundry tracing

These controls surround the Responses API but do not create a separate nested Azure request object.

---

# Request

## Request Parameters

Top-level request parameters include:

- `model`
- `input`
- `instructions`
- `reasoning`
- `max_output_tokens`
- `tools`
- `tool_choice`
- `parallel_tool_calls`
- `max_tool_calls`
- `text`
- `previous_response_id`
- `store`
- `stream`
- `background`
- `metadata`
- `include`

Support for individual parameters and parameter values can depend on the selected model.

---

## Request Structure

The following structure shows how the major request parameters and their subfields relate to each other.

```json
{
  "model": "<deployment-name>",

  "input": [
    {
      "role": "user",

      "content": [
        {
          "type": "input_text",
          "text": "<text>"
        },

        {
          "type": "input_image",
          "image_url": "<image-url-or-data-url>",
          "file_id": "<optional-file-id>",
          "detail": "auto"
        },

        {
          "type": "input_file",
          "file_id": "<optional-file-id>",
          "file_url": "<optional-file-url>",
          "filename": "<optional-filename>",
          "file_data": "<optional-file-data>"
        }
      ]
    }
  ],

  "instructions": "<instructions>",

  "reasoning": {
    "effort": "<reasoning-effort>",
    "mode": "<reasoning-mode>",
    "context": "<reasoning-context>"
  },

  "max_output_tokens": 12000,

  "tools": [],

  "tool_choice": "auto",

  "parallel_tool_calls": true,

  "max_tool_calls": null,

  "text": {
    "verbosity": "medium"
  },

  "previous_response_id": null,

  "store": false,

  "stream": false,

  "background": false,

  "metadata": {},

  "include": []
}
```

Only parameters required by a particular request need to be supplied.

---

# Request Parameter Reference

## `model`

**Type:** string

**Required:** yes

Identifies the model deployment that processes the request.

With Azure OpenAI, this value refers to the Azure deployment name.

---

## `input`

**Type:** string or structured input

**Required:** yes

Contains the content supplied to the model.

A simple request can provide plain text.

Structured input can contain messages with:

- `role`
- `content`

Structured content can contain multiple content types in the same message.

---

### `input[].role`

**Type:** string

Identifies the role associated with a structured input message.

Supported message roles include:

- `user`
- `system`
- `developer`

---

### `input[].content`

**Type:** array

Contains one or more input content items.

Content items can include:

- `input_text`
- `input_image`
- `input_file`

Other input-item types can exist for tool and conversation workflows.

---

### `input_text`

Text input content.

Fields:

- `type`
- `text`

`type` is:

`input_text`

`text` contains the supplied text.

---

### `input_image`

Image input content.

Fields can include:

- `type`
- `image_url`
- `file_id`
- `detail`

`type` is:

`input_image`

An image can be supplied through:

- Public image URL
- Base64 data URL
- Uploaded file ID

---

### `input_image.detail`

**Type:** string

Controls the visual detail level where supported.

Values:

- `auto`
- `low`
- `high`

Default:

`auto`

---

### `input_file`

File input content.

Fields can include:

- `type`
- `file_id`
- `file_url`
- `filename`
- `file_data`

`type` is:

`input_file`

A file can be referenced using an uploaded file identifier or supplied directly where supported.

---

### PDF Input

PDF documents can be supplied as file input to supported vision-capable models.

A PDF can provide both:

- Extracted document text
- Rendered page images

This allows the model to reason about textual and visual content in the same document.

---

## `instructions`

**Type:** string

**Required:** no

Provides high-level instructions that guide the model response.

Instructions can define:

- Behavior
- Constraints
- Output requirements
- Task context

---

## `reasoning`

**Type:** object

**Required:** no

Configures reasoning behavior for supported reasoning models.

Possible subfields include:

- `effort`
- `mode`
- `context`

Support depends on the selected model.

---

### `reasoning.effort`

**Type:** string

Controls reasoning effort.

Values supported by current reasoning models can include:

- `none`
- `low`
- `medium`
- `high`
- `xhigh`
- `max`

Not every model supports every value.

Higher reasoning effort can increase:

- Reasoning depth
- Latency
- Token use

---

### `reasoning.mode`

**Type:** string

Controls reasoning mode on models that support this feature.

Values can include:

- `standard`
- `pro`

Support is model-dependent.

---

### `reasoning.context`

**Type:** string

Controls how reasoning context is retained or reused where supported.

Values can include:

- `auto`
- `current_turn`
- `all_turns`

Support is model-dependent.

---

## `max_output_tokens`

**Type:** integer

**Required:** no

Sets the maximum output-token budget.

The allowed maximum depends on the selected model.

The budget can include:

- Visible output tokens
- Reasoning tokens

---

## `tools`

**Type:** array

**Required:** no

Defines tools that the model is allowed to call.

Depending on the model and platform configuration, tools can include:

- Function tools
- Web Search
- File Search
- Code Interpreter
- MCP tools
- Other supported tools

Each tool type has its own configuration structure.

---

## `tool_choice`

**Type:** string or object

**Required:** no

Controls how the model selects tools.

Common values include:

- `none`
- `auto`
- `required`

Specific tools can also be selected explicitly where supported.

---

## `parallel_tool_calls`

**Type:** boolean

**Required:** no

Controls whether compatible tool calls can be issued in parallel.

---

## `max_tool_calls`

**Type:** integer

**Required:** no

Limits the number of applicable tool calls processed during a response.

Support can depend on the tools being used.

---

## `text`

**Type:** object

**Required:** no

Controls text-output configuration.

It can contain settings such as:

- Verbosity
- Structured-output formatting

---

### `text.verbosity`

**Type:** string

Controls response verbosity on supported models.

Values:

- `low`
- `medium`
- `high`

---

## `previous_response_id`

**Type:** string

**Required:** no

Identifies an earlier response that should be continued.

This allows a new response to reference earlier response state without resending all previous content.

---

## `store`

**Type:** boolean

**Required:** no

Controls whether response state is stored by the service.

Stored responses can support operations such as:

- Retrieval
- Continuation
- Background polling

---

## `stream`

**Type:** boolean

**Required:** no

Enables incremental response streaming.

When enabled, the API emits response events as generation progresses.

---

## `background`

**Type:** boolean

**Required:** no

Allows supported requests to run asynchronously.

Background responses can enter states including:

- `queued`
- `in_progress`

Azure background execution requires stored response state.

---

## `metadata`

**Type:** object

**Required:** no

Associates application-defined metadata with a response.

Metadata consists of key-value information attached to the response object.

---

## `include`

**Type:** array

**Required:** no

Requests additional optional information in the response.

Available values depend on the features and tools used by the request.

---

# Response

## Response Parameters

Common response parameters include:

- `id`
- `object`
- `created_at`
- `completed_at`
- `status`
- `model`
- `output`
- `output_text`
- `usage`
- `error`
- `incomplete_details`
- `previous_response_id`
- `metadata`

The exact response can contain additional fields depending on:

- Model
- Tools
- Streaming
- Background execution
- Azure content filtering

---

## Response Structure

The following structure shows the relationship between major response parameters and their subfields.

```json
{
  "id": "resp_123",

  "object": "response",

  "created_at": 1234567890,

  "completed_at": 1234567891,

  "status": "completed",

  "model": "<deployment-name>",

  "output": [
    {
      "type": "message",

      "role": "assistant",

      "status": "completed",

      "content": [
        {
          "type": "output_text",
          "text": "<generated-text>"
        }
      ]
    }
  ],

  "output_text": "<generated-text>",

  "usage": {
    "input_tokens": 100,

    "input_tokens_details": {
      "cached_tokens": 0
    },

    "output_tokens": 50,

    "output_tokens_details": {
      "reasoning_tokens": 20
    },

    "total_tokens": 150
  },

  "error": null,

  "incomplete_details": null,

  "previous_response_id": null,

  "metadata": {}
}
```

The exact contents of `output` depend on what the model did during the response.

---

# Response Parameter Reference

## `id`

**Type:** string

Unique response identifier.

It can be used for operations including:

- Response retrieval
- Response continuation
- Background polling
- Cancellation where supported

---

## `object`

**Type:** string

Identifies the returned object type.

Typical value:

`response`

---

## `created_at`

**Type:** timestamp

Indicates when the response was created.

---

## `completed_at`

**Type:** timestamp or null

Indicates when the response completed where available.

---

## `status`

**Type:** string

Indicates response state.

Values can include:

- `completed`
- `failed`
- `in_progress`
- `cancelled`
- `queued`
- `incomplete`

---

## `model`

**Type:** string

Identifies the model deployment used for the response.

---

## `output`

**Type:** array

Contains structured output items.

Output items can include:

- Assistant messages
- Tool calls
- Tool results
- Reasoning-related items
- Other supported response item types

---

### Message Output

A normal assistant message can contain:

- `type`
- `role`
- `status`
- `content`

For an assistant message:

`role`

is typically:

`assistant`

---

### `output_text`

Text output content uses:

`type`

value:

`output_text`

and contains a:

`text`

field.

---

## `output_text`

**Type:** string

Convenience representation of aggregated text output.

It provides direct access to generated text without manually traversing the complete `output` array.

---

## `usage`

**Type:** object

Contains token-usage information.

Subfields can include:

- `input_tokens`
- `input_tokens_details`
- `output_tokens`
- `output_tokens_details`
- `total_tokens`

---

### `usage.input_tokens`

Number of input tokens processed.

---

### `usage.input_tokens_details.cached_tokens`

Number of input tokens served from cache where applicable.

---

### `usage.output_tokens`

Number of output tokens generated.

---

### `usage.output_tokens_details.reasoning_tokens`

Number of reported reasoning tokens where supported.

---

### `usage.total_tokens`

Total token usage for the response.

---

## `error`

**Type:** object or null

Contains response-level error information when applicable.

---

## `incomplete_details`

**Type:** object or null

Provides information when a response ends without normal completion.

Causes can include:

- Output-token limits
- Content filtering
- Other incomplete-response conditions

---

## `previous_response_id`

**Type:** string or null

Identifies the previous response when response continuation is being used.

---

## `metadata`

**Type:** object

Contains metadata associated with the response.

---

# Azure Errors and Content Filtering

Azure OpenAI can reject or interrupt a request because of platform-level conditions including:

- Invalid authentication
- Invalid deployment
- Rate-limit exhaustion
- Quota exhaustion
- Resource permissions
- Content filtering
- Deployment configuration
- Service availability

Azure content-filtering information can also be returned with applicable requests or responses.

These conditions are separate from normal model output.

---

# Examples

## Basic Text Request

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    input:
      "Explain photosynthesis.",
  });
```

---

## Structured Text Request

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    input: [
      {
        role:
          "user",

        content: [
          {
            type:
              "input_text",

            text:
              "Explain photosynthesis.",
          },
        ],
      },
    ],
  });
```

---

## Text and Image Request

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    input: [
      {
        role:
          "user",

        content: [
          {
            type:
              "input_text",

            text:
              "Describe this image.",
          },

          {
            type:
              "input_image",

            image_url:
              "https://example.com/image.png",
          },
        ],
      },
    ],
  });
```

---

## Text and PDF Request

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    input: [
      {
        role:
          "user",

        content: [
          {
            type:
              "input_file",

            filename:
              "document.pdf",

            file_data:
              "data:application/pdf;base64,<BASE64_DATA>",
          },

          {
            type:
              "input_text",

            text:
              "Summarize this document.",
          },
        ],
      },
    ],
  });
```

---

## Reasoning Request

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    input:
      "Analyze this problem.",

    reasoning: {
      effort:
        "high",
    },

    max_output_tokens:
      12000,
  });
```

---

## Continued Response

```js
const response =
  await client.responses.create({
    model:
      "gpt-5.6-terra",

    previous_response_id:
      "resp_123",

    input:
      "Explain that in more detail.",
  });
```