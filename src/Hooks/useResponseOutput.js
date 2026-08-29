import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  OUTPUT_FILE_TYPES,
  createErrorOutputFile,
  createTextOutputFile,
  extractResponseFiles,
  getResponseErrorMessage,
  hydrateContainerFile,
} from "../Services/Files/ResponseFiles";


/*
 * Owns the Console -> Output execution
 * pipeline: submitting a response, turning
 * it into chat messages + Output files,
 * hydrating container files, and reporting
 * errors. Takes syncOutputWidgets so it can
 * keep the widget-layout hook's offsets/
 * sizes in step with the current file list
 * without owning that state itself.
 */
function useResponseOutput({
  syncOutputWidgets,
  resetOutputViewport,
}) {
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


  const [
    outputFiles,
    setOutputFiles,
  ] =
    useState([]);


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


        syncOutputWidgets(
          files,
        );
      },
      [
        syncOutputWidgets,
      ],
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
        resetOutputViewport?.();


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
      resetOutputViewport,
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
  };
}


export default useResponseOutput;
