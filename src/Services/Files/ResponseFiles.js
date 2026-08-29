import openAIResponsesApi from "../Azure/OpenAIResponses";


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


export {
  OUTPUT_FILE_TYPES,
  getFileExtension,
  getMimeType,
  extractResponseFiles,
  createTextOutputFile,
  createErrorOutputFile,
  getResponseErrorMessage,
  hydrateContainerFile,
};
