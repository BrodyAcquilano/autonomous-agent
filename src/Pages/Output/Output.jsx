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


const OUTPUT_PLACEHOLDER_KEY =
  "__output-placeholder__";


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
   AUTOMATIC WINDOW LAYOUT
-------------------------------- */

/*
 * Keep five slots per row.
 *
 * 430px matches the widest standard
 * non-resized Output window footprint:
 * document/text/code/markdown windows.
 *
 * Image windows are slightly narrower,
 * so they simply receive a little more
 * visual breathing room.
 */
const OUTPUT_WINDOWS_PER_ROW =
  5;


const OUTPUT_LAYOUT_WINDOW_WIDTH =
  430;


/*
 * ViewportWindow currently supplies this
 * shared world-space base position:
 *
 *   left: 96px;
 *   top: 96px;
 *
 * Automatic offsets are relative to that
 * base, so subtract it from the calculated
 * absolute stage position.
 */
const OUTPUT_WINDOW_BASE_LEFT =
  96;


const OUTPUT_WIDGET_ROW_SPACING =
  590;


/*
 * Six horizontal gaps for five windows:
 *
 * | gap | window | gap | window | ... | gap |
 *
 * This gives the left edge, four inner
 * spaces, and right edge the same share
 * of the unused virtual-stage width.
 */
function getAutomaticWindowOffset(
  index,
  stageWidth,
) {
  const safeStageWidth =
    Number.isFinite(
      stageWidth,
    ) &&
    stageWidth >
      0
      ? stageWidth
      : 3200;


  const totalWindowWidth =
    OUTPUT_WINDOWS_PER_ROW *
    OUTPUT_LAYOUT_WINDOW_WIDTH;


  const horizontalGap =
    Math.max(
      0,
      (
        safeStageWidth -
        totalWindowWidth
      ) /
      (
        OUTPUT_WINDOWS_PER_ROW +
        1
      ),
    );


  const columnIndex =
    index %
    OUTPUT_WINDOWS_PER_ROW;


  const rowIndex =
    Math.floor(
      index /
      OUTPUT_WINDOWS_PER_ROW,
    );


  const absoluteX =
    horizontalGap +
    columnIndex *
    (
      OUTPUT_LAYOUT_WINDOW_WIDTH +
      horizontalGap
    );


  return {
    /*
     * ViewportWindow.css already contributes
     * its 96px base-left value.
     */
    x:
      absoluteX -
      OUTPUT_WINDOW_BASE_LEFT,

    y:
      rowIndex *
      OUTPUT_WIDGET_ROW_SPACING,
  };
}


function isStoredWindowOffset(
  value,
) {
  return (
    Number.isFinite(
      value?.x,
    ) &&
    Number.isFinite(
      value?.y,
    )
  );
}


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


  if (
    mimeType ===
      "application/pdf" ||
    extension ===
      "pdf"
  ) {
    return "pdf";
  }


  if (
    mimeType ===
      "text/markdown" ||
    markdownExtensions.has(
      extension,
    )
  ) {
    return "markdown";
  }


  if (
    codeExtensions.has(
      extension,
    )
  ) {
    return "code";
  }


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
   SAVE HELPERS
-------------------------------- */

function canSaveOutputFile(
  file,
) {
  if (
    !file ||
    file.placeholder
  ) {
    return false;
  }


  return Boolean(
    typeof file.content ===
      "string" ||
    typeof file.text ===
      "string" ||
    file.blobUrl ||
    file.dataUrl ||
    file.url ||
    file.base64,
  );
}


function base64ToBlob(
  base64,
  mimeType,
) {
  const byteCharacters =
    atob(
      base64,
    );


  const byteNumbers =
    new Uint8Array(
      byteCharacters.length,
    );


  for (
    let index = 0;
    index <
    byteCharacters.length;
    index += 1
  ) {
    byteNumbers[
      index
    ] =
      byteCharacters.charCodeAt(
        index,
      );
  }


  return new Blob(
    [
      byteNumbers,
    ],
    {
      type:
        mimeType ||
        "application/octet-stream",
    },
  );
}


function triggerDownload(
  href,
  fileName,
  revokeAfter =
    false,
) {
  const anchor =
    document.createElement(
      "a",
    );


  anchor.href =
    href;


  anchor.download =
    fileName ||
    "output";


  anchor.rel =
    "noopener";


  document.body.appendChild(
    anchor,
  );


  anchor.click();


  anchor.remove();


  if (
    revokeAfter
  ) {
    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          href,
        );
      },
      0,
    );
  }
}


function saveOutputFile(
  file,
) {
  if (
    !canSaveOutputFile(
      file,
    )
  ) {
    return;
  }


  const fileName =
    file.fileName ||
    "output";


  if (
    file.blobUrl
  ) {
    triggerDownload(
      file.blobUrl,
      fileName,
    );


    return;
  }


  if (
    file.dataUrl ||
    file.url
  ) {
    triggerDownload(
      file.dataUrl ||
      file.url,

      fileName,
    );


    return;
  }


  if (
    typeof file.base64 ===
      "string" &&
    file.base64
  ) {
    const blob =
      base64ToBlob(
        file.base64,
        file.mimeType ||
          "application/octet-stream",
      );


    const blobUrl =
      URL.createObjectURL(
        blob,
      );


    triggerDownload(
      blobUrl,
      fileName,
      true,
    );


    return;
  }


  const content =
    typeof file.content ===
      "string"
      ? file.content
      : file.text;


  if (
    typeof content ===
    "string"
  ) {
    const blob =
      new Blob(
        [
          content,
        ],
        {
          type:
            file.mimeType ||
            "text/plain",
        },
      );


    const blobUrl =
      URL.createObjectURL(
        blob,
      );


    triggerDownload(
      blobUrl,
      fileName,
      true,
    );
  }
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

  widgetOffsets = {},

  setWidgetOffset =
    null,

  widgetSizes = {},

  setWidgetSize =
    null,

  viewportView =
    null,

  setViewportView =
    null,
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


  const windows =
    files.length >
    0
      ? files
      : [
          {
            id:
              OUTPUT_PLACEHOLDER_KEY,

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
      <Viewport
        view={
          viewportView
        }
        onViewChange={
          setViewportView
        }
      >
        {({
          stageSize,
        }) =>
          windows.map(
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


              const storedOffset =
                widgetOffsets[
                  fileId
                ];


              /*
               * Runtime only stores an offset
               * after the user has actually
               * arranged this window.
               *
               * Otherwise calculate the default
               * five-column position from the
               * exact current virtual-stage width.
               */
              const offset =
                isStoredWindowOffset(
                  storedOffset,
                )
                  ? storedOffset
                  : getAutomaticWindowOffset(
                      index,
                      stageSize
                        ?.width,
                    );


              const size =
                widgetSizes[
                  fileId
                ] ||
                null;


              const aspectRatio =
                rendererType ===
                  "image"
                  ? imageAspectRatios[
                      fileId
                    ] ||
                    null
                  : null;


              const canSave =
                canSaveOutputFile(
                  file,
                );


              return (
                <ViewportWindow
                  key={
                    fileId
                  }

                  offset={
                    offset
                  }

                  onOffsetChange={(
                    nextOffset,
                  ) => {
                    if (
                      typeof setWidgetOffset ===
                      "function"
                    ) {
                      setWidgetOffset(
                        fileId,
                        nextOffset,
                      );
                    }
                  }}

                  size={
                    size
                  }

                  onSizeChange={(
                    nextSize,
                  ) => {
                    if (
                      typeof setWidgetSize ===
                      "function"
                    ) {
                      setWidgetSize(
                        fileId,
                        nextSize,
                      );
                    }
                  }}

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

                  showSave={
                    !file.placeholder
                  }

                  canSave={
                    canSave
                  }

                  onSave={() => {
                    saveOutputFile(
                      file,
                    );
                  }}
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
          )
        }
      </Viewport>
    </main>
  );
}


export default Output;