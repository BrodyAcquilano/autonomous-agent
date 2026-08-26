import {
  useEffect,
  useState,
} from "react";


function extractResponseFiles(
  response,
) {
  const files =
    [];


  /*
   * Responses API generated files can
   * appear as container-file citations
   * attached to output text.
   */
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
   * Image-generation route output.
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


function useRuntime() {
  const [
    messages,
    setMessages,
  ] =
    useState([]);


  /*
   * Only the latest complete API
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
   * Output belongs only to the latest
   * response.
   *
   * It is replaced every time a new
   * response arrives.
   */
  const [
    outputFiles,
    setOutputFiles,
  ] =
    useState([]);


  useEffect(
    () => {
      /*
       * A new command sets response to
       * null before executing.
       *
       * This clears the previous Output
       * workspace immediately.
       */
      if (
        !response
      ) {
        setOutputFiles(
          [],
        );

        return;
      }


      const outputText =
        typeof response.output_text ===
          "string"
          ? response.output_text.trim()
          : "";


      /*
       * Console keeps the conversational
       * history.
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


      /*
       * Output represents only this run.
       *
       * The normal assistant response is
       * represented as a text file so the
       * Output page can render it alongside
       * images, PDFs, code, and other files.
       */
      const nextOutputFiles =
        [];


      const textFile =
        createTextOutputFile(
          response,
          outputText,
        );


      if (
        textFile
      ) {
        nextOutputFiles.push(
          textFile,
        );
      }


      nextOutputFiles.push(
        ...extractResponseFiles(
          response,
        ),
      );


      setOutputFiles(
        nextOutputFiles,
      );
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
  };
}


export default useRuntime;