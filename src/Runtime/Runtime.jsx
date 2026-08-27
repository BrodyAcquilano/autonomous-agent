import { useEffect, useState } from "react";

import openAIResponsesApi from "../Api/Azure/OpenAIResponses";

/* --------------------------------
   OUTPUT FILE TYPES
-------------------------------- */

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "mjs",
  "cjs",

  "ts",
  "tsx",

  "py",

  "java",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",

  "go",
  "rs",

  "php",
  "rb",
  "swift",
  "kt",

  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",

  "sql",

  "sh",
  "bash",
  "ps1",

  "xml",
  "yaml",
  "yml",
]);

const TEXT_EXTENSIONS = new Set(["txt", "log", "csv", "tsv", "json"]);

const MARKDOWN_EXTENSIONS = new Set(["md", "mdx", "markdown"]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

const OUTPUT_FILE_TYPES = {
  codeExtensions: CODE_EXTENSIONS,

  textExtensions: TEXT_EXTENSIONS,

  markdownExtensions: MARKDOWN_EXTENSIONS,

  imageExtensions: IMAGE_EXTENSIONS,
};

/*
 * These extensions all contain text
 * internally, even though Output may
 * render them differently.
 */
const TEXT_CONTENT_EXTENSIONS = new Set([
  ...CODE_EXTENSIONS,
  ...TEXT_EXTENSIONS,
  ...MARKDOWN_EXTENSIONS,
]);

/* --------------------------------
   FILE HELPERS
-------------------------------- */

function getFileExtension(fileName) {
  if (typeof fileName !== "string") {
    return "";
  }

  const parts = fileName.toLowerCase().split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop() || "";
}

function getMimeType(fileName) {
  const extension = getFileExtension(fileName);

  switch (extension) {
    case "pdf":
      return "application/pdf";

    case "csv":
      return "text/csv";

    case "tsv":
      return "text/tab-separated-values";

    case "json":
      return "application/json";

    case "md":
    case "mdx":
    case "markdown":
      return "text/markdown";

    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "text/javascript";

    case "html":
    case "htm":
      return "text/html";

    case "css":
      return "text/css";

    case "xml":
      return "application/xml";

    case "png":
      return "image/png";

    case "jpg":
    case "jpeg":
      return "image/jpeg";

    case "webp":
      return "image/webp";

    case "gif":
      return "image/gif";

    case "zip":
      return "application/zip";

    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    default:
      if (TEXT_CONTENT_EXTENSIONS.has(extension)) {
        return "text/plain";
      }

      return "application/octet-stream";
  }
}

/* --------------------------------
   RESPONSE EXTRACTION
-------------------------------- */

function extractResponseFiles(response) {
  const files = [];

  let generatedImageIndex = 0;

  if (Array.isArray(response?.output)) {
    const seenFiles = new Set();

    response.output.forEach((outputItem) => {
      /*
       * Image-generation tool output.
       */
      if (
        outputItem?.type === "image_generation_call" &&
        typeof outputItem.result === "string" &&
        outputItem.result
      ) {
        generatedImageIndex += 1;

        files.push({
          id:
            outputItem.id ||
            `image-generation-${response?.id || Date.now()}-${generatedImageIndex}`,

          type: "image",

          fileName: `generated-${generatedImageIndex}.png`,

          mimeType: "image/png",

          base64: outputItem.result,
        });
      }

      /*
       * Code Interpreter and other
       * container-generated files.
       */
      if (!Array.isArray(outputItem?.content)) {
        return;
      }

      outputItem.content.forEach((contentItem) => {
        if (!Array.isArray(contentItem?.annotations)) {
          return;
        }

        contentItem.annotations.forEach((annotation) => {
          if (
            annotation?.type !== "container_file_citation" ||
            !annotation.file_id
          ) {
            return;
          }

          const id = `${annotation.container_id || "container"}:${annotation.file_id}`;

          if (seenFiles.has(id)) {
            return;
          }

          seenFiles.add(id);

          files.push({
            id,

            type: "container-file",

            fileId: annotation.file_id,

            containerId: annotation.container_id || null,

            fileName: annotation.filename || annotation.file_id,
          });
        });
      });
    });
  }

  /*
   * Standalone Images API output.
   */
  if (Array.isArray(response?.images)) {
    response.images.forEach((image) => {
      const mimeType = image.mimeType || "image/png";

      let extension = "png";

      if (mimeType === "image/jpeg") {
        extension = "jpg";
      }

      if (mimeType === "image/webp") {
        extension = "webp";
      }

      files.push({
        id: `image-${response.created || Date.now()}-${image.index}`,

        type: "image",

        fileName: `generated-${image.index + 1}.${extension}`,

        mimeType,

        base64: image.base64,
      });
    });
  }

  return files;
}

/* --------------------------------
   TEXT OUTPUT
-------------------------------- */

function createTextOutputFile(response, outputText) {
  if (!outputText) {
    return null;
  }

  return {
    id: `response-text-${response?.id || Date.now()}`,

    type: "text",

    fileName: "response.txt",

    mimeType: "text/plain",

    content: outputText,
  };
}

/* --------------------------------
   ERROR OUTPUT
-------------------------------- */

function createErrorOutputFile(content) {
  return {
    id: `error-${crypto.randomUUID()}`,

    type: "text",

    fileName: "error.txt",

    mimeType: "text/plain",

    content,
  };
}

function getResponseErrorMessage(response) {
  if (!response) {
    return null;
  }

  if (typeof response.error === "string") {
    return response.error;
  }

  if (typeof response.error?.message === "string") {
    return response.error.message;
  }

  if (response.status === "failed") {
    return "The model response failed.";
  }

  return null;
}

/* --------------------------------
   CONTAINER FILE HYDRATION
-------------------------------- */

async function hydrateContainerFile(file) {
  if (file?.type !== "container-file" || !file.containerId || !file.fileId) {
    return file;
  }

  const blob = await openAIResponsesApi.getContainerFileContent(
    file.containerId,
    file.fileId,
  );

  const extension = getFileExtension(file.fileName);

  const mimeType = getMimeType(file.fileName);

  const typedBlob = new Blob([blob], {
    type: mimeType,
  });

  /*
   * Text-like files become strings.
   *
   * Output still decides whether that
   * string uses TextRenderer,
   * MarkdownRenderer or CodeRenderer.
   */
  if (TEXT_CONTENT_EXTENSIONS.has(extension)) {
    const content = await typedBlob.text();

    return {
      ...file,

      mimeType,

      content,
    };
  }

  /*
   * Binary files use browser blob URLs.
   */
  const blobUrl = URL.createObjectURL(typedBlob);

  return {
    ...file,

    mimeType,

    blobUrl,
  };
}

/* --------------------------------
   WIDGET POSITIONS (save positions so changing pages doesn't move them)
-------------------------------- */

const DEFAULT_CONSOLE_WIDGET_OFFSETS = {
  lightPanel: {
    x: 0,
    y: 0,
  },

  messagePanel: {
    x: 0,
    y: 0,
  },

  requestControlPanel: {
    x: 0,
    y: 0,
  },
};

/* --------------------------------
   RUNTIME
-------------------------------- */

function useRuntime() {
  const [messages, setMessages] = useState([]);

  const [response, setResponse] = useState(null);

  const [outputFiles, setOutputFiles] = useState([]);

  /*
   * This is application lifecycle state,
   * NOT a live Azure health check.
   *
   * ready:
   * no request is running and the latest
   * execution finished successfully.
   *
   * busy:
   * waiting for model response or
   * hydrating generated output files.
   *
   * error:
   * latest execution or file hydration
   * failed.
   */
  const [systemStatus, setSystemStatus] = useState("ready");

  const [consoleWidgetOffsets, setConsoleWidgetOffsets] = useState(
    DEFAULT_CONSOLE_WIDGET_OFFSETS,
  );

  function setConsoleWidgetOffset(widgetKey, nextOffset) {
    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_CONSOLE_WIDGET_OFFSETS,
        widgetKey,
      )
    ) {
      return;
    }

    if (!Number.isFinite(nextOffset?.x) || !Number.isFinite(nextOffset?.y)) {
      return;
    }

    setConsoleWidgetOffsets((current) => ({
      ...current,

      [widgetKey]: {
        x: nextOffset.x,

        y: nextOffset.y,
      },
    }));
  }

  /*
   * Shared error path for request errors.
   *
   * Makes the same error visible in:
   *
   * 1. MessagePanel
   * 2. Output
   * 3. LightPanel
   */
  function reportError(content) {
    const message =
      typeof content === "string" && content.trim()
        ? content.trim()
        : "Unknown system error.";

    setMessages((currentMessages) => [
      ...currentMessages,

      {
        id: crypto.randomUUID(),

        role: "error",

        label: "SYSTEM",

        content: message,
      },
    ]);

    setOutputFiles([createErrorOutputFile(message)]);

    setSystemStatus("error");
  }

  useEffect(() => {
    let cancelled = false;

    const createdBlobUrls = [];

    /*
     * CommandShell sets response to null
     * when a new execution starts.
     *
     * Output clears immediately, but
     * systemStatus remains BUSY because
     * CommandShell controls that state.
     */
    if (!response) {
      setOutputFiles([]);

      return undefined;
    }

    async function processResponse() {
      /*
       * Runtime also asserts BUSY here
       * because file hydration belongs
       * to the same execution lifecycle.
       */
      setSystemStatus("busy");

      const responseError = getResponseErrorMessage(response);

      if (responseError) {
        if (!cancelled) {
          reportError(responseError);
        }

        return;
      }

      const outputText =
        typeof response.output_text === "string"
          ? response.output_text.trim()
          : "";

      /*
       * Console message history.
       */
      if (outputText) {
        setMessages((currentMessages) => [
          ...currentMessages,

          {
            id: crypto.randomUUID(),

            role: "assistant",

            label: "ASSISTANT",

            content: outputText,
          },
        ]);
      }

      const currentOutputFiles = [];

      /*
       * Normal assistant response also
       * becomes response.txt.
       */
      const textFile = createTextOutputFile(response, outputText);

      if (textFile) {
        currentOutputFiles.push(textFile);
      }

      const extractedFiles = extractResponseFiles(response);

      /*
       * Display descriptors immediately
       * while generated files download.
       */
      if (!cancelled) {
        setOutputFiles([...currentOutputFiles, ...extractedFiles]);
      }

      /*
       * Hydrate every generated container
       * file in parallel.
       */
      const hydrationResults = await Promise.all(
        extractedFiles.map(async (file) => {
          try {
            const hydratedFile = await hydrateContainerFile(file);

            if (hydratedFile?.blobUrl) {
              createdBlobUrls.push(hydratedFile.blobUrl);
            }

            return {
              file: hydratedFile,

              error: null,
            };
          } catch (error) {
            const errorMessage = `${file.fileName || "Output file"}: ${
              error.message || "Failed to load output file."
            }`;

            return {
              file: {
                ...file,

                loadError: errorMessage,
              },

              error: errorMessage,
            };
          }
        }),
      );

      if (cancelled) {
        createdBlobUrls.forEach((blobUrl) => {
          URL.revokeObjectURL(blobUrl);
        });

        return;
      }

      const hydratedFiles = hydrationResults.map((result) => result.file);

      const hydrationErrors = hydrationResults
        .map((result) => result.error)
        .filter(Boolean);

      /*
       * One or more generated files failed
       * to download.
       *
       * Keep successful files, but also
       * surface a SYSTEM error.
       */
      if (hydrationErrors.length > 0) {
        const errorMessage = ["OUTPUT FILE ERROR", ...hydrationErrors].join(
          "\n",
        );

        setMessages((currentMessages) => [
          ...currentMessages,

          {
            id: crypto.randomUUID(),

            role: "error",

            label: "SYSTEM",

            content: errorMessage,
          },
        ]);

        setOutputFiles([
          ...currentOutputFiles,
          ...hydratedFiles,

          createErrorOutputFile(errorMessage),
        ]);

        setSystemStatus("error");

        return;
      }

      /*
       * Response and all generated files
       * completed successfully.
       */
      setOutputFiles([...currentOutputFiles, ...hydratedFiles]);

      setSystemStatus("ready");
    }

    processResponse();

    return () => {
      cancelled = true;

      createdBlobUrls.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [response]);

  return {
    messages,
    setMessages,

    response,
    setResponse,

    outputFiles,

    outputFileTypes: OUTPUT_FILE_TYPES,

    systemStatus,
    setSystemStatus,

    reportError,

    consoleWidgetOffsets,
    setConsoleWidgetOffset,
  };
}

export default useRuntime;
