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
   * Also understand the current shape
   * returned by the image-generation
   * route, so runtime is already capable
   * of representing those outputs later.
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


        const extension =
          mimeType ===
          "image/jpeg"
            ? "jpg"
            : "png";


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


function useRuntime() {
  const [
    messages,
    setMessages,
  ] =
    useState([]);


  /*
   * Only the most recent complete API
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
   * Files belong only to the current
   * response. They are replaced rather
   * than accumulated forever.
   */
  const [
    outputFiles,
    setOutputFiles,
  ] =
    useState([]);


  useEffect(
    () => {
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


      setOutputFiles(
        extractResponseFiles(
          response,
        ),
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