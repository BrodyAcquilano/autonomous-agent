import {
  useRef,
  useState,
} from "react";

import requestServiceApi from "../../../../Services/InternalOperations/RequestService";

import "./CommandShell.css";


const ACCEPTED_ATTACHMENT_TYPES =
  new Set([
    "application/pdf",

    "image/png",
    "image/jpeg",
    "image/webp",
  ]);


const ACCEPTED_ATTACHMENT_INPUT =
  [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ].join(
    ",",
  );


const MAX_ATTACHMENTS =
  10;


const MAX_FILE_SIZE_BYTES =
  20 *
  1024 *
  1024;


const MAX_TOTAL_ATTACHMENT_BYTES =
  40 *
  1024 *
  1024;


function formatFileSize(
  bytes,
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }


  if (
    bytes <
    1024 *
    1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }


  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(1)} MB`;
}


function CommandShell({
  requestSettings,

  setMessages,
  setResponse,

  systemStatus,
  setSystemStatus,

  reportError,
}) {
  const [
    command,
    setCommand,
  ] =
    useState(
      "",
    );


  const [
    attachments,
    setAttachments,
  ] =
    useState([]);


  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false,
    );


  /*
   * systemStatus is shared app-wide — a
   * Maintenance-triggered restart can set it to
   * "busy" too, not only a Console submission of
   * its own, so the shell locks on either.
   */
  const isBusy =
    isSubmitting ||
    systemStatus ===
      "busy";


  const fileInputRef =
    useRef(
      null,
    );


  function addSystemMessage(
    content,
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
            "error",

          label:
            "SYSTEM",

          content,
        },
      ],
    );
  }


  function handleSelectFiles(
    event,
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ||
        [],
      );


    event.target.value =
      "";


    if (
      selectedFiles.length ===
      0
    ) {
      return;
    }


    const nextAttachments =
      [
        ...attachments,
      ];


    const errors =
      [];


    selectedFiles.forEach(
      (
        file,
      ) => {
        if (
          !ACCEPTED_ATTACHMENT_TYPES.has(
            file.type,
          )
        ) {
          errors.push(
            `${file.name}: unsupported file type.`,
          );


          return;
        }


        if (
          file.size >
          MAX_FILE_SIZE_BYTES
        ) {
          errors.push(
            `${file.name}: file exceeds the 20 MB limit.`,
          );


          return;
        }


        if (
          nextAttachments.length >=
          MAX_ATTACHMENTS
        ) {
          errors.push(
            `Maximum of ${MAX_ATTACHMENTS} attachments allowed.`,
          );


          return;
        }


        const isDuplicate =
          nextAttachments.some(
            (
              currentFile,
            ) =>
              currentFile.name ===
                file.name &&
              currentFile.size ===
                file.size &&
              currentFile.lastModified ===
                file.lastModified,
          );


        if (
          isDuplicate
        ) {
          return;
        }


        const totalBytes =
          nextAttachments.reduce(
            (
              total,
              currentFile,
            ) =>
              total +
              currentFile.size,
            0,
          ) +
          file.size;


        if (
          totalBytes >
          MAX_TOTAL_ATTACHMENT_BYTES
        ) {
          errors.push(
            "Combined attachments exceed the 40 MB limit.",
          );


          return;
        }


        nextAttachments.push(
          file,
        );
      },
    );


    setAttachments(
      nextAttachments,
    );


    if (
      errors.length >
      0
    ) {
      addSystemMessage(
        errors.join(
          "\n",
        ),
      );
    }
  }


  function removeAttachment(
    index,
  ) {
    if (
      isBusy
    ) {
      return;
    }


    setAttachments(
      (
        current,
      ) =>
        current.filter(
          (
            file,
            currentIndex,
          ) =>
            currentIndex !==
            index,
        ),
    );
  }


  const handleSubmit =
    async (
      event,
    ) => {
      event.preventDefault();


      const input =
        command.trim();


      if (
        !input ||
        isBusy
      ) {
        return;
      }


      setMessages(
        (
          currentMessages,
        ) => [
          ...currentMessages,

          {
            id:
              crypto.randomUUID(),

            role:
              "user",

            label:
              "YOU",

            content:
              input,
          },
        ],
      );


      setSystemStatus(
        "busy",
      );


      setResponse(
        null,
      );


      setCommand(
        "",
      );


      setIsSubmitting(
        true,
      );


      /*
       * The Console no longer builds an Azure
       * request directly. requestSettings is
       * sent to the Router as control-panel
       * hints (an attached file) — the Router
       * decides model/API/tools/capabilities
       * and assembles the actual request itself.
       */
      try {
        const result =
          await requestServiceApi.request(
            input,
            requestSettings,
            attachments,
          );


        if (
          result.status ===
          "blocked"
        ) {
          const log =
            result.log;


          reportError(
            `${log
              ?.type
              ?.toUpperCase() ||
              "MAINTENANCE"} LOG: ${
              log?.message ||
              "The Router could not complete this task."
            }\n${
              log?.details ||
              ""
            }`.trim(),
          );


          return;
        }


        setResponse(
          result.response,
        );


        setAttachments(
          [],
        );
      } catch (
        error
      ) {
        const errorMessage =
          error
            .response
            ?.data
            ?.message ||
          error
            .response
            ?.data
            ?.error ||
          error.message ||
          "Request failed.";


        reportError(
          errorMessage,
        );
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };


  return (
    <form
      className="command-shell"
      onSubmit={
        handleSubmit
      }
    >
      {attachments.length >
        0 && (
        <div className="command-attachments">
          {attachments.map(
            (
              file,
              index,
            ) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="command-attachment"
              >
                <div className="command-attachment-info">
                  <span className="command-attachment-name">
                    {file.name}
                  </span>


                  <span className="command-attachment-size">
                    {formatFileSize(
                      file.size,
                    )}
                  </span>
                </div>


                <button
                  type="button"
                  className="command-attachment-remove"
                  aria-label={`Remove ${file.name}`}
                  disabled={
                    isBusy
                  }
                  onClick={() => {
                    removeAttachment(
                      index,
                    );
                  }}
                >
                  ×
                </button>
              </div>
            ),
          )}
        </div>
      )}


      <input
        ref={
          fileInputRef
        }
        className="command-file-input"
        type="file"
        multiple
        accept={
          ACCEPTED_ATTACHMENT_INPUT
        }
        onChange={
          handleSelectFiles
        }
      />


      <div className="command-shell-main">
        <div className="command-prefix">
          &gt;
        </div>


        <input
          className="command-input"
          type="text"
          value={
            command
          }
          disabled={
            isBusy
          }
          placeholder={
            isSubmitting
              ? "PROCESSING..."
              : systemStatus ===
                "busy"
                ? "SYSTEM BUSY..."
                : "ENTER COMMAND OR TASK..."
          }
          onChange={(
            event,
          ) => {
            setCommand(
              event.target.value,
            );
          }}
        />


        <button
          type="button"
          className="command-file-button"
          aria-label="Add input file"
          title="Add PDF or image"
          disabled={
            isBusy
          }
          onClick={() => {
            fileInputRef
              .current
              ?.click();
          }}
        >
          +
        </button>


        <button
          type="submit"
          className="command-run-button"
          disabled={
            isBusy
          }
        >
          {isSubmitting
            ? "WORKING"
            : systemStatus ===
              "busy"
              ? "BUSY"
              : "EXECUTE"}
        </button>
      </div>
    </form>
  );
}


export default CommandShell;