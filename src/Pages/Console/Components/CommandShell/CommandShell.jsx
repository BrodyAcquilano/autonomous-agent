import {
  useRef,
  useState,
} from "react";

import openAIResponsesApi from "../../../../Api/Azure/OpenAIResponses";

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
  model,
  requestSettings,

  setMessages,
  setResponse,

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
      isSubmitting
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
        isSubmitting
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


      /*
       * Entire request lifecycle begins.
       */
      setSystemStatus(
        "busy",
      );


      /*
       * Clear previous response/output.
       */
      setResponse(
        null,
      );


      setCommand(
        "",
      );


      setIsSubmitting(
        true,
      );


      const tools =
        [];


      /*
       * Image Generation
       */
      const imageGeneration =
        requestSettings
          .tools
          ?.image_generation;


      if (
        imageGeneration?.enabled
      ) {
        const imageGenerationTool = {
          type:
            "image_generation",
        };


        if (
          imageGeneration.quality
        ) {
          imageGenerationTool.quality =
            imageGeneration.quality;
        }


        if (
          imageGeneration.size
        ) {
          imageGenerationTool.size =
            imageGeneration.size;
        }


        tools.push(
          imageGenerationTool,
        );
      }


      /*
       * Code Interpreter
       */
      const codeInterpreter =
        requestSettings
          .tools
          ?.code_interpreter;


      if (
        codeInterpreter?.enabled
      ) {
        tools.push({
          type:
            "code_interpreter",

          container: {
            type:
              "auto",
          },
        });
      }


      const request = {
        model,

        input,

        reasoning: {
          effort:
            requestSettings
              .reasoning
              .effort,

          mode:
            requestSettings
              .reasoning
              .mode,
        },

        max_output_tokens:
          requestSettings
            .max_output_tokens,

        text: {
          verbosity:
            requestSettings
              .text
              .verbosity,
        },
      };


      if (
        tools.length >
        0
      ) {
        request.tools =
          tools;
      }


      try {
        const response =
          await openAIResponsesApi.request(
            request,
            attachments,
          );


        /*
         * Runtime takes over from here.
         *
         * It keeps status BUSY while
         * container files hydrate.
         */
        setResponse(
          response,
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


        /*
         * Runtime puts this into:
         *
         * MessagePanel
         * Output/error.txt
         * systemStatus = error
         */
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
                    isSubmitting
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
          placeholder={
            isSubmitting
              ? "PROCESSING..."
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
            isSubmitting
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
            isSubmitting
          }
        >
          {isSubmitting
            ? "WORKING"
            : "EXECUTE"}
        </button>
      </div>
    </form>
  );
}


export default CommandShell;