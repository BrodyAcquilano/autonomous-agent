import {
  useCallback,
  useEffect,
  useState,
} from "react";

import openAIResponsesApi from "../Api/Azure/OpenAIResponses";


/* --------------------------------
   OUTPUT FILE TYPES
-------------------------------- */

const CODE_EXTENSIONS =
  new Set([
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


const TEXT_EXTENSIONS =
  new Set([
    "txt",
    "log",

    "csv",
    "tsv",

    "json",
  ]);


const MARKDOWN_EXTENSIONS =
  new Set([
    "md",
    "mdx",
    "markdown",
  ]);


const IMAGE_EXTENSIONS =
  new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
  ]);


const OUTPUT_FILE_TYPES = {
  codeExtensions:
    CODE_EXTENSIONS,

  textExtensions:
    TEXT_EXTENSIONS,

  markdownExtensions:
    MARKDOWN_EXTENSIONS,

  imageExtensions:
    IMAGE_EXTENSIONS,
};


const TEXT_CONTENT_EXTENSIONS =
  new Set([
    ...CODE_EXTENSIONS,
    ...TEXT_EXTENSIONS,
    ...MARKDOWN_EXTENSIONS,
  ]);


/* --------------------------------
   FILE HELPERS
-------------------------------- */

function getFileExtension(
  fileName,
) {
  if (
    typeof fileName !==
    "string"
  ) {
    return "";
  }


  const parts =
    fileName
      .toLowerCase()
      .split(
        ".",
      );


  if (
    parts.length <
    2
  ) {
    return "";
  }


  return (
    parts.pop() ||
    ""
  );
}


function getMimeType(
  fileName,
) {
  const extension =
    getFileExtension(
      fileName,
    );


  switch (
    extension
  ) {
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
      if (
        TEXT_CONTENT_EXTENSIONS.has(
          extension,
        )
      ) {
        return "text/plain";
      }


      return "application/octet-stream";
  }
}


/* --------------------------------
   RESPONSE FILE EXTRACTION
-------------------------------- */

function extractResponseFiles(
  response,
) {
  const files =
    [];


  let generatedImageIndex =
    0;


  if (
    Array.isArray(
      response?.output,
    )
  ) {
    const seenFiles =
      new Set();


    response.output.forEach(
      (
        outputItem,
      ) => {
        /*
         * Responses Image Generation.
         */
        if (
          outputItem?.type ===
            "image_generation_call" &&
          typeof outputItem.result ===
            "string" &&
          outputItem.result
        ) {
          generatedImageIndex +=
            1;


          files.push({
            id:
              outputItem.id ||
              `image-generation-${response?.id || Date.now()}-${generatedImageIndex}`,

            type:
              "image",

            fileName:
              `generated-${generatedImageIndex}.png`,

            mimeType:
              "image/png",

            base64:
              outputItem.result,
          });
        }


        /*
         * Code Interpreter /
         * container-generated files.
         */
        if (
          !Array.isArray(
            outputItem?.content,
          )
        ) {
          return;
        }


        outputItem.content.forEach(
          (
            contentItem,
          ) => {
            if (
              !Array.isArray(
                contentItem?.annotations,
              )
            ) {
              return;
            }


            contentItem.annotations.forEach(
              (
                annotation,
              ) => {
                if (
                  annotation?.type !==
                    "container_file_citation" ||
                  !annotation.file_id
                ) {
                  return;
                }


                const id =
                  `${annotation.container_id || "container"}:${annotation.file_id}`;


                if (
                  seenFiles.has(
                    id,
                  )
                ) {
                  return;
                }


                seenFiles.add(
                  id,
                );


                files.push({
                  id,

                  type:
                    "container-file",

                  fileId:
                    annotation.file_id,

                  containerId:
                    annotation.container_id ||
                    null,

                  fileName:
                    annotation.filename ||
                    annotation.file_id,
                });
              },
            );
          },
        );
      },
    );
  }


  /*
   * Standalone Images API output.
   */
  if (
    Array.isArray(
      response?.images,
    )
  ) {
    response.images.forEach(
      (
        image,
      ) => {
        const mimeType =
          image.mimeType ||
          "image/png";


        let extension =
          "png";


        if (
          mimeType ===
          "image/jpeg"
        ) {
          extension =
            "jpg";
        }


        if (
          mimeType ===
          "image/webp"
        ) {
          extension =
            "webp";
        }


        files.push({
          id:
            `image-${response.created || Date.now()}-${image.index}`,

          type:
            "image",

          fileName:
            `generated-${image.index + 1}.${extension}`,

          mimeType,

          base64:
            image.base64,
        });
      },
    );
  }


  return files;
}


/* --------------------------------
   NORMAL TEXT OUTPUT
-------------------------------- */

function createTextOutputFile(
  response,
  outputText,
) {
  if (
    !outputText
  ) {
    return null;
  }


  return {
    id:
      `response-text-${response?.id || Date.now()}`,

    type:
      "text",

    fileName:
      "response.txt",

    mimeType:
      "text/plain",

    content:
      outputText,
  };
}


/* --------------------------------
   ERROR OUTPUT
-------------------------------- */

function createErrorOutputFile(
  content,
) {
  return {
    id:
      `error-${crypto.randomUUID()}`,

    type:
      "text",

    fileName:
      "error.txt",

    mimeType:
      "text/plain",

    content,
  };
}


function getResponseErrorMessage(
  response,
) {
  if (
    !response
  ) {
    return null;
  }


  if (
    typeof response.error ===
    "string"
  ) {
    return response.error;
  }


  if (
    typeof response.error?.message ===
    "string"
  ) {
    return response.error.message;
  }


  if (
    response.status ===
    "failed"
  ) {
    return "The model response failed.";
  }


  return null;
}


/* --------------------------------
   CONTAINER FILE HYDRATION
-------------------------------- */

async function hydrateContainerFile(
  file,
) {
  if (
    file?.type !==
      "container-file" ||
    !file.containerId ||
    !file.fileId
  ) {
    return file;
  }


  const blob =
    await openAIResponsesApi
      .getContainerFileContent(
        file.containerId,
        file.fileId,
      );


  const extension =
    getFileExtension(
      file.fileName,
    );


  const mimeType =
    getMimeType(
      file.fileName,
    );


  const typedBlob =
    new Blob(
      [
        blob,
      ],
      {
        type:
          mimeType,
      },
    );


  if (
    TEXT_CONTENT_EXTENSIONS.has(
      extension,
    )
  ) {
    const content =
      await typedBlob.text();


    return {
      ...file,

      mimeType,

      content,
    };
  }


  const blobUrl =
    URL.createObjectURL(
      typedBlob,
    );


  return {
    ...file,

    mimeType,

    blobUrl,
  };
}


/* --------------------------------
   OUTPUT WINDOW LAYOUT STATE
-------------------------------- */

const OUTPUT_PLACEHOLDER_KEY =
  "__output-placeholder__";


function getOutputWidgetKey(
  file,
  index,
) {
  return (
    file?.id ||
    `${file?.fileName || "output"}-${index}`
  );
}


function createOutputWidgetOffsets(
  files,
  currentOffsets = {},
) {
  /*
   * Runtime remembers user-arranged
   * positions, but it no longer decides
   * the automatic grid geometry.
   *
   * A null value means:
   *
   * "This window has never been manually
   * arranged. Output may place it using
   * the current virtual-stage width."
   *
   * Once the user drags/resizes from a
   * north/west edge, setOutputWidgetOffset
   * replaces null with the real x/y value.
   */
  const nextOffsets = {
    [OUTPUT_PLACEHOLDER_KEY]:
      Object.prototype
        .hasOwnProperty.call(
          currentOffsets,
          OUTPUT_PLACEHOLDER_KEY,
        )
        ? currentOffsets[
            OUTPUT_PLACEHOLDER_KEY
          ]
        : null,
  };


  if (
    !Array.isArray(
      files,
    ) ||
    files.length ===
      0
  ) {
    return nextOffsets;
  }


  files.forEach(
    (
      file,
      index,
    ) => {
      const widgetKey =
        getOutputWidgetKey(
          file,
          index,
        );


      nextOffsets[
        widgetKey
      ] =
        Object.prototype
          .hasOwnProperty.call(
            currentOffsets,
            widgetKey,
          )
          ? currentOffsets[
              widgetKey
            ]
          : null;
    },
  );


  return nextOffsets;
}

function createEmptyWidgetSize() {
  return {
    width:
      null,

    height:
      null,
  };
}


function createOutputWidgetSizes(
  files,
  currentSizes = {},
) {
  const nextSizes = {
    [OUTPUT_PLACEHOLDER_KEY]:
      currentSizes[
        OUTPUT_PLACEHOLDER_KEY
      ] ||
      createEmptyWidgetSize(),
  };


  if (
    !Array.isArray(
      files,
    ) ||
    files.length ===
      0
  ) {
    return nextSizes;
  }


  files.forEach(
    (
      file,
      index,
    ) => {
      const widgetKey =
        getOutputWidgetKey(
          file,
          index,
        );


      nextSizes[
        widgetKey
      ] =
        currentSizes[
          widgetKey
        ] ||
        createEmptyWidgetSize();
    },
  );


  return nextSizes;
}


/* --------------------------------
   RUNTIME
-------------------------------- */

function useRuntime() {
  const [
    messages,
    setMessages,
  ] =
    useState([]);


  const [
    response,
    setResponse,
  ] =
    useState(
      null,
    );


  const [
    requestSettings,
    setRequestSettings,
  ] =
    useState({
      reasoning: {
        effort:
          "medium",

        mode:
          "standard",
      },

      max_output_tokens:
        12000,

      text: {
        verbosity:
          "medium",
      },

      tools: {
        image_generation: {
          enabled:
            false,

          quality:
            "auto",

          size:
            "auto",
        },

        code_interpreter: {
          enabled:
            false,
        },

        web_search: {
          enabled:
            false,
        },
      },
    });


  /*
   * Each page owns a different
   * viewport implementation.
   *
   * Runtime only remembers the
   * camera state.
   */
  const [
    consoleViewportView,
    setConsoleViewportView,
  ] =
    useState(
      null,
    );


  const [
    outputViewportView,
    setOutputViewportView,
  ] =
    useState(
      null,
    );


  const [
    outputFiles,
    setOutputFiles,
  ] =
    useState([]);


  /*
   * Frontend execution status.
   *
   * This is not an Azure health check.
   */
  const [
    systemStatus,
    setSystemStatus,
  ] =
    useState(
      "ready",
    );


  /*
   * Console widget movement is stored
   * separately from Output movement.
   *
   * CSS defines the base positions.
   * These values are only offsets.
   */
  const [
    consoleWidgetOffsets,
    setConsoleWidgetOffsets,
  ] =
    useState({
      lightPanel: {
        x:
          0,

        y:
          0,
      },

      messagePanel: {
        x:
          0,

        y:
          0,
      },

      requestControlPanel: {
        x:
          0,

        y:
          0,
      },
    });


  /*
   * Dynamic Output windows are keyed
   * by their output file IDs.
   */
  const [
    outputWidgetOffsets,
    setOutputWidgetOffsets,
  ] =
    useState({
      /*
       * null means the placeholder has not
       * been manually arranged yet.
       *
       * Output will place it using the same
       * evenly-spaced stage layout as normal
       * output windows.
       */
      [OUTPUT_PLACEHOLDER_KEY]:
        null,
    });


  /*
   * Resizable Console widgets keep their
   * dimensions in Runtime just like their
   * offsets.
   *
   * LightPanel is intentionally omitted
   * because it is no longer resizable.
   */
  const [
    consoleWidgetSizes,
    setConsoleWidgetSizes,
  ] =
    useState({
      messagePanel:
        createEmptyWidgetSize(),

      requestControlPanel:
        createEmptyWidgetSize(),
    });


  /*
   * Dynamic Output window dimensions are
   * keyed by the same IDs as their offsets.
   */
  const [
    outputWidgetSizes,
    setOutputWidgetSizes,
  ] =
    useState({
      [OUTPUT_PLACEHOLDER_KEY]:
        createEmptyWidgetSize(),
    });


  const setConsoleWidgetOffset =
    useCallback(
      (
        widgetKey,
        nextOffset,
      ) => {
        if (
          !Number.isFinite(
            nextOffset?.x,
          ) ||
          !Number.isFinite(
            nextOffset?.y,
          )
        ) {
          return;
        }


        setConsoleWidgetOffsets(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                x:
                  nextOffset.x,

                y:
                  nextOffset.y,
              },
            };
          },
        );
      },
      [],
    );


  const setOutputWidgetOffset =
    useCallback(
      (
        widgetKey,
        nextOffset,
      ) => {
        if (
          !Number.isFinite(
            nextOffset?.x,
          ) ||
          !Number.isFinite(
            nextOffset?.y,
          )
        ) {
          return;
        }


        setOutputWidgetOffsets(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                x:
                  nextOffset.x,

                y:
                  nextOffset.y,
              },
            };
          },
        );
      },
      [],
    );


  const setConsoleWidgetSize =
    useCallback(
      (
        widgetKey,
        nextSize,
      ) => {
        if (
          !Number.isFinite(
            nextSize?.width,
          ) ||
          !Number.isFinite(
            nextSize?.height,
          )
        ) {
          return;
        }


        setConsoleWidgetSizes(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                width:
                  nextSize.width,

                height:
                  nextSize.height,
              },
            };
          },
        );
      },
      [],
    );


  const setOutputWidgetSize =
    useCallback(
      (
        widgetKey,
        nextSize,
      ) => {
        if (
          !Number.isFinite(
            nextSize?.width,
          ) ||
          !Number.isFinite(
            nextSize?.height,
          )
        ) {
          return;
        }


        setOutputWidgetSizes(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                width:
                  nextSize.width,

                height:
                  nextSize.height,
              },
            };
          },
        );
      },
      [],
    );


  const setCurrentOutputFiles =
    useCallback(
      (
        nextFiles,
      ) => {
        const files =
          Array.isArray(
            nextFiles,
          )
            ? nextFiles
            : [];


        setOutputFiles(
          files,
        );


        setOutputWidgetOffsets(
          (
            currentOffsets,
          ) =>
            createOutputWidgetOffsets(
              files,
              currentOffsets,
            ),
        );


        setOutputWidgetSizes(
          (
            currentSizes,
          ) =>
            createOutputWidgetSizes(
              files,
              currentSizes,
            ),
        );
      },
      [],
    );


  /*
   * Shared request-error path.
   */
  const reportError =
    useCallback(
      (
        content,
      ) => {
        const message =
          typeof content ===
            "string" &&
          content.trim()
            ? content.trim()
            : "Unknown system error.";


        setMessages(
          (
            currentMessages,
          ) => [
            ...currentMessages,

            {
              id:
                crypto.randomUUID(),

              role:
                "error",

              label:
                "SYSTEM",

              content:
                message,
            },
          ],
        );


        setCurrentOutputFiles(
          [
            createErrorOutputFile(
              message,
            ),
          ],
        );


        setSystemStatus(
          "error",
        );
      },
      [
        setCurrentOutputFiles,
      ],
    );


  useEffect(
    () => {
      let cancelled =
        false;


      const createdBlobUrls =
        [];


      /*
       * A new execution clears the
       * previous Output run.
       */
      if (
        !response
      ) {
        setCurrentOutputFiles(
          [],
        );


        /*
         * A new output run returns to the
         * Output viewport's default camera.
         *
         * The Output viewport defines that
         * default as fully zoomed out and
         * centered on the finite stage.
         *
         * Route changes alone do not reset
         * this because response does not
         * change.
         */
        setOutputViewportView(
          null,
        );


        return undefined;
      }


      async function processResponse() {
        setSystemStatus(
          "busy",
        );


        const responseError =
          getResponseErrorMessage(
            response,
          );


        if (
          responseError
        ) {
          if (
            !cancelled
          ) {
            reportError(
              responseError,
            );
          }


          return;
        }


        const outputText =
          typeof response.output_text ===
            "string"
            ? response.output_text.trim()
            : "";


        if (
          outputText
        ) {
          setMessages(
            (
              currentMessages,
            ) => [
              ...currentMessages,

              {
                id:
                  crypto.randomUUID(),

                role:
                  "assistant",

                label:
                  "ASSISTANT",

                content:
                  outputText,
              },
            ],
          );
        }


        const currentOutputFiles =
          [];


        const textFile =
          createTextOutputFile(
            response,
            outputText,
          );


        if (
          textFile
        ) {
          currentOutputFiles.push(
            textFile,
          );
        }


        const extractedFiles =
          extractResponseFiles(
            response,
          );


        /*
         * Put file descriptors into Output
         * immediately while hydration runs.
         */
        if (
          !cancelled
        ) {
          setCurrentOutputFiles(
            [
              ...currentOutputFiles,
              ...extractedFiles,
            ],
          );
        }


        const hydrationResults =
          await Promise.all(
            extractedFiles.map(
              async (
                file,
              ) => {
                try {
                  const hydratedFile =
                    await hydrateContainerFile(
                      file,
                    );


                  if (
                    hydratedFile
                      ?.blobUrl
                  ) {
                    createdBlobUrls.push(
                      hydratedFile.blobUrl,
                    );
                  }


                  return {
                    file:
                      hydratedFile,

                    error:
                      null,
                  };
                } catch (
                  error
                ) {
                  const errorMessage =
                    `${file.fileName || "Output file"}: ${
                      error.message ||
                      "Failed to load output file."
                    }`;


                  return {
                    file: {
                      ...file,

                      loadError:
                        errorMessage,
                    },

                    error:
                      errorMessage,
                  };
                }
              },
            ),
          );


        if (
          cancelled
        ) {
          createdBlobUrls.forEach(
            (
              blobUrl,
            ) => {
              URL.revokeObjectURL(
                blobUrl,
              );
            },
          );


          return;
        }


        const hydratedFiles =
          hydrationResults.map(
            (
              result,
            ) =>
              result.file,
          );


        const hydrationErrors =
          hydrationResults
            .map(
              (
                result,
              ) =>
                result.error,
            )
            .filter(
              Boolean,
            );


        if (
          hydrationErrors.length >
          0
        ) {
          const errorMessage =
            [
              "OUTPUT FILE ERROR",
              ...hydrationErrors,
            ].join(
              "\n",
            );


          setMessages(
            (
              currentMessages,
            ) => [
              ...currentMessages,

              {
                id:
                  crypto.randomUUID(),

                role:
                  "error",

                label:
                  "SYSTEM",

                content:
                  errorMessage,
              },
            ],
          );


          setCurrentOutputFiles(
            [
              ...currentOutputFiles,
              ...hydratedFiles,

              createErrorOutputFile(
                errorMessage,
              ),
            ],
          );


          setSystemStatus(
            "error",
          );


          return;
        }


        /*
         * Hydrated files keep the same IDs,
         * so Output window positions survive.
         */
        setCurrentOutputFiles(
          [
            ...currentOutputFiles,
            ...hydratedFiles,
          ],
        );


        setSystemStatus(
          "ready",
        );
      }


      processResponse();


      return () => {
        cancelled =
          true;


        createdBlobUrls.forEach(
          (
            blobUrl,
          ) => {
            URL.revokeObjectURL(
              blobUrl,
            );
          },
        );
      };
    },
    [
      response,
      reportError,
      setCurrentOutputFiles,
    ],
  );


  return {
    messages,
    setMessages,

    response,
    setResponse,

    outputFiles,

    outputFileTypes:
      OUTPUT_FILE_TYPES,

    systemStatus,
    setSystemStatus,

    reportError,

    requestSettings,
    setRequestSettings,

    consoleWidgetOffsets,
    setConsoleWidgetOffset,

    consoleWidgetSizes,
    setConsoleWidgetSize,

    outputWidgetOffsets,
    setOutputWidgetOffset,

    outputWidgetSizes,
    setOutputWidgetSize,

    consoleViewportView,
    setConsoleViewportView,

    outputViewportView,
    setOutputViewportView,
  };
}


export default useRuntime;