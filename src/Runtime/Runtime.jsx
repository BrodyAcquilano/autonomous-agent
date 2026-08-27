import {
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


/*
 * These are the semantic groups used
 * by Output to choose a renderer.
 *
 * Runtime owns them so there is one
 * source of truth.
 */
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


/*
 * Runtime has a different question:
 *
 * "Can these bytes safely be decoded
 * into JavaScript text?"
 *
 * Code, Markdown, CSV, JSON, etc. are
 * all text content even though Output
 * renders them differently.
 */
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
      /*
       * Known text-like extensions can
       * safely use text/plain.
       */
      if (
        TEXT_CONTENT_EXTENSIONS.has(
          extension,
        )
      ) {
        return "text/plain";
      }


      /*
       * Unknown content should NOT be
       * assumed to be text.
       */
      return "application/octet-stream";
  }
}


/* --------------------------------
   RESPONSE EXTRACTION
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
         * Image-generation tool output.
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
         * Code Interpreter and other
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
   *
   * Keep this because a future worker
   * may call OpenAIImages directly.
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
   NORMAL RESPONSE TEXT
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


  /*
   * Browser calls our Express route.
   *
   * Express calls Azure.
   *
   * Azure returns the actual container
   * file bytes.
   */
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


  /*
   * Axios receives the response as a Blob,
   * but the Azure route deliberately returns
   * application/octet-stream.
   *
   * Re-wrap it with the MIME type inferred
   * from the generated filename.
   */
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


  /*
   * Code, Markdown, CSV, JSON and normal
   * text files all become file.content.
   *
   * Output will later decide WHICH renderer
   * displays that content.
   */
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


  /*
   * Binary files remain binary.
   *
   * A browser blob URL gives renderers a
   * normal source without exposing Azure
   * credentials or Azure APIs to Output.
   */
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
   RUNTIME
-------------------------------- */

function useRuntime() {
  const [
    messages,
    setMessages,
  ] =
    useState([]);


  /*
   * Only the newest complete API
   * response is retained.
   */
  const [
    response,
    setResponse,
  ] =
    useState(
      null,
    );


  /*
   * Output belongs only to the newest
   * response.
   */
  const [
    outputFiles,
    setOutputFiles,
  ] =
    useState([]);


  useEffect(
    () => {
      let cancelled =
        false;


      /*
       * Every binary file hydrated by this
       * response may create a blob URL.
       *
       * Keep track of them so we can release
       * browser memory when the next response
       * replaces this one.
       */
      const createdBlobUrls =
        [];


      /*
       * CommandShell sets response to null
       * before starting a new command.
       *
       * That immediately clears Output.
       */
      if (
        !response
      ) {
        setOutputFiles(
          [],
        );


        return undefined;
      }


      async function processResponse() {
        const outputText =
          typeof response.output_text ===
            "string"
            ? response.output_text.trim()
            : "";


        /*
         * Console retains assistant message
         * history independently from Output.
         */
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


        /*
         * Normal assistant text also appears
         * as one output text document.
         */
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


        /*
         * Extract image tool outputs and
         * container-file descriptors.
         */
        const extractedFiles =
          extractResponseFiles(
            response,
          );


        /*
         * Show the descriptors immediately.
         *
         * A generated file can briefly display
         * CONTENT NOT LOADED while its bytes
         * are being fetched.
         */
        if (
          !cancelled
        ) {
          setOutputFiles([
            ...currentOutputFiles,
            ...extractedFiles,
          ]);
        }


        /*
         * Retrieve actual container file
         * contents in parallel.
         */
        const hydratedFiles =
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
                    hydratedFile?.blobUrl
                  ) {
                    createdBlobUrls.push(
                      hydratedFile.blobUrl,
                    );
                  }


                  return hydratedFile;
                } catch (
                  error
                ) {
                  /*
                   * Preserve the descriptor even
                   * if hydration fails so Output
                   * can still identify the file.
                   */
                  return {
                    ...file,

                    loadError:
                      error.message ||
                      "Failed to load output file.",
                  };
                }
              },
            ),
          );


        /*
         * Response changed while the files
         * were downloading.
         */
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


        /*
         * Replace descriptors with fully
         * hydrated output files.
         */
        setOutputFiles([
          ...currentOutputFiles,
          ...hydratedFiles,
        ]);
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
    ],
  );


  return {
    messages,
    setMessages,

    response,
    setResponse,

    outputFiles,

    /*
     * Shared file classification definitions
     * used by Output.
     */
    outputFileTypes:
      OUTPUT_FILE_TYPES,
  };
}


export default useRuntime;