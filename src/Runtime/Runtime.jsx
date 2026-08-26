import {
  useEffect,
  useState,
} from "react";


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
         * Container-generated files.
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
   * Keep this because later the worker
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