import {
  useState,
} from "react";

import Viewport from "./Components/Viewport/Viewport";
import ViewportWindow from "./Components/ViewportWindow/ViewportWindow";

import CodeRenderer from "./Renderers/CodeRenderer/CodeRenderer";
import ImageRenderer from "./Renderers/ImageRenderer/ImageRenderer";
import MarkdownRenderer from "./Renderers/MarkdownRenderer/MarkdownRenderer";
import PdfRenderer from "./Renderers/PdfRenderer/PdfRenderer";
import TextRenderer from "./Renderers/TextRenderer/TextRenderer";
import UnknownRenderer from "./Renderers/UnknownRenderer/UnknownRenderer";

import "./Output.css";


const EMPTY_FILE_TYPES = {
  codeExtensions:
    new Set(),

  textExtensions:
    new Set(),

  markdownExtensions:
    new Set(),

  imageExtensions:
    new Set(),
};


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


function getRendererType(
  file,
  fileTypes,
) {
  if (
    file?.placeholder
  ) {
    return "placeholder";
  }


  const {
    codeExtensions,
    textExtensions,
    markdownExtensions,
    imageExtensions,
  } =
    fileTypes;


  const mimeType =
    typeof file?.mimeType ===
      "string"
      ? file.mimeType
          .toLowerCase()
      : "";


  const extension =
    getFileExtension(
      file?.fileName,
    );


  /*
   * Images
   */
  if (
    mimeType.startsWith(
      "image/",
    ) ||
    imageExtensions.has(
      extension,
    )
  ) {
    return "image";
  }


  /*
   * PDF
   */
  if (
    mimeType ===
      "application/pdf" ||
    extension ===
      "pdf"
  ) {
    return "pdf";
  }


  /*
   * Markdown must be checked before
   * generic text because its MIME type
   * also begins with text/.
   */
  if (
    mimeType ===
      "text/markdown" ||
    markdownExtensions.has(
      extension,
    )
  ) {
    return "markdown";
  }


  /*
   * Code must also be checked before
   * generic text because code files
   * commonly use text MIME types.
   */
  if (
    codeExtensions.has(
      extension,
    )
  ) {
    return "code";
  }


  /*
   * Normal text files.
   *
   * JSON is included through its
   * extension even though its MIME
   * type is application/json.
   */
  if (
    mimeType.startsWith(
      "text/",
    ) ||
    textExtensions.has(
      extension,
    )
  ) {
    return "text";
  }


  return "unknown";
}


/* --------------------------------
   WINDOW TYPE
-------------------------------- */

function getWindowVariant(
  rendererType,
) {
  switch (
    rendererType
  ) {
    case "image":
      return "image";


    case "pdf":
      return "document";


    case "markdown":
    case "code":
    case "text":
      return "document";


    default:
      return "default";
  }
}


/* --------------------------------
   WINDOW POSITION
-------------------------------- */

function getWindowOffset(
  index,
  count,
) {
  const columns =
    Math.min(
      Math.max(
        count,
        1,
      ),
      3,
    );


  const column =
    index %
    columns;


  const row =
    Math.floor(
      index /
      columns,
    );


  const centerColumn =
    (
      columns -
      1
    ) /
    2;


  return {
    x:
      (
        column -
        centerColumn
      ) *
      470,

    y:
      row *
      590,
  };
}


/* --------------------------------
   RENDERER ROUTING
-------------------------------- */

function renderOutputFile({
  file,
  rendererType,
  onImageAspectRatio,
}) {
  switch (
    rendererType
  ) {
    case "placeholder":
      return null;


    case "image":
      return (
        <ImageRenderer
          file={
            file
          }
          onAspectRatio={
            onImageAspectRatio
          }
        />
      );


    case "pdf":
      return (
        <PdfRenderer
          file={
            file
          }
        />
      );


    case "markdown":
      return (
        <MarkdownRenderer
          file={
            file
          }
        />
      );


    case "code":
      return (
        <CodeRenderer
          file={
            file
          }
        />
      );


    case "text":
      return (
        <TextRenderer
          file={
            file
          }
        />
      );


    case "unknown":
      return (
        <UnknownRenderer
          file={
            file
          }
        />
      );


    default:
      return null;
  }
}


/* --------------------------------
   OUTPUT
-------------------------------- */

function Output({
  outputFiles = [],
  fileTypes =
    EMPTY_FILE_TYPES,
}) {
  const [
    imageAspectRatios,
    setImageAspectRatios,
  ] =
    useState({});


  const files =
    Array.isArray(
      outputFiles,
    )
      ? outputFiles
      : [];


  /*
   * Keep one empty window when there
   * are no current output files.
   */
  const windows =
    files.length >
    0
      ? files
      : [
          {
            id:
              "__output-placeholder__",

            placeholder:
              true,
          },
        ];


  function handleImageAspectRatio(
    fileId,
    aspectRatio,
  ) {
    if (
      !fileId ||
      !Number.isFinite(
        aspectRatio,
      ) ||
      aspectRatio <=
        0
    ) {
      return;
    }


    setImageAspectRatios(
      (
        current,
      ) => {
        if (
          current[
            fileId
          ] ===
          aspectRatio
        ) {
          return current;
        }


        return {
          ...current,

          [fileId]:
            aspectRatio,
        };
      },
    );
  }


  return (
    <main
      className="output-page"
      role="region"
      aria-label="Output"
    >
      <Viewport>
        {windows.map(
          (
            file,
            index,
          ) => {
            const fileId =
              file.id ||
              `${file.fileName || "output"}-${index}`;


            const rendererType =
              getRendererType(
                file,
                fileTypes,
              );


            const windowVariant =
              getWindowVariant(
                rendererType,
              );


            const initialOffset =
              getWindowOffset(
                index,
                windows.length,
              );


            const aspectRatio =
              rendererType ===
                "image"
                ? imageAspectRatios[
                    fileId
                  ] ||
                  null
                : null;


            return (
              <ViewportWindow
                key={
                  fileId
                }
                initialOffset={
                  initialOffset
                }
                zIndex={
                  20 +
                  index
                }
                variant={
                  windowVariant
                }
                aspectRatio={
                  aspectRatio
                }
                ariaLabel={
                  file.placeholder
                    ? "Empty output window"
                    : file.fileName ||
                      `Output file ${index + 1}`
                }
              >
                {renderOutputFile({
                  file,

                  rendererType,

                  onImageAspectRatio:
                    (
                      ratio,
                    ) => {
                      handleImageAspectRatio(
                        fileId,
                        ratio,
                      );
                    },
                })}
              </ViewportWindow>
            );
          },
        )}
      </Viewport>
    </main>
  );
}


export default Output;