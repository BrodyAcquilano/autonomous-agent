import multer from "multer";


const ACCEPTED_IMAGE_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);


const ACCEPTED_FILE_TYPES =
  new Set([
    "application/pdf",
  ]);


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


const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      files:
        MAX_ATTACHMENTS,

      fileSize:
        MAX_FILE_SIZE_BYTES,
    },

    fileFilter: (
      req,
      file,
      callback,
    ) => {
      const isAccepted =
        ACCEPTED_IMAGE_TYPES.has(
          file.mimetype,
        ) ||
        ACCEPTED_FILE_TYPES.has(
          file.mimetype,
        );


      if (
        isAccepted
      ) {
        callback(
          null,
          true,
        );

        return;
      }


      const error =
        new Error(
          `Unsupported attachment type: ${file.mimetype || "unknown"}.`,
        );


      error.code =
        "UNSUPPORTED_ATTACHMENT_TYPE";


      callback(
        error,
      );
    },
  });


function uploadAttachments(
  req,
  res,
  next,
) {
  upload.array(
    "attachments",
    MAX_ATTACHMENTS,
  )(
    req,
    res,
    (
      error,
    ) => {
      if (
        !error
      ) {
        next();

        return;
      }


      if (
        error instanceof
        multer.MulterError
      ) {
        const status =
          error.code ===
          "LIMIT_FILE_SIZE"
            ? 413
            : 400;


        res
          .status(
            status,
          )
          .json({
            error:
              "Attachment upload failed.",

            message:
              error.message,
          });

        return;
      }


      if (
        error.code ===
        "UNSUPPORTED_ATTACHMENT_TYPE"
      ) {
        res
          .status(415)
          .json({
            error:
              "Unsupported attachment type.",

            message:
              error.message,
          });

        return;
      }


      res
        .status(400)
        .json({
          error:
            "Attachment upload failed.",

          message:
            error.message,
        });
    },
  );
}


function getSafeFileName(
  fileName,
) {
  return String(
    fileName ||
    "attachment",
  ).replace(
    /[\r\n"]/g,
    "_",
  );
}


function createAttachmentContent(
  file,
) {
  const base64 =
    file.buffer.toString(
      "base64",
    );


  if (
    ACCEPTED_IMAGE_TYPES.has(
      file.mimetype,
    )
  ) {
    return {
      type:
        "input_image",

      image_url:
        `data:${file.mimetype};base64,${base64}`,

      detail:
        "auto",
    };
  }


  if (
    file.mimetype ===
    "application/pdf"
  ) {
    return {
      type:
        "input_file",

      filename:
        getSafeFileName(
          file.originalname,
        ),

      file_data:
        `data:application/pdf;base64,${base64}`,
    };
  }


  throw new Error(
    `Unsupported attachment type: ${file.mimetype}`,
  );
}


function buildInput(
  input,
  attachments,
) {
  if (
    !attachments?.length
  ) {
    return (
      typeof input ===
        "string"
        ? input.trim()
        : input
    );
  }


  /*
   * Current browser upload workflow:
   *
   * typed command
   * +
   * uploaded attachments
   *
   * More complicated structured-input
   * construction can be added later on
   * the server for agent workflows.
   */
  if (
    typeof input !==
      "string" ||
    !input.trim()
  ) {
    const error =
      new Error(
        "Attachments currently require text input.",
      );


    error.code =
      "INVALID_ATTACHMENT_INPUT";


    throw error;
  }


  const content =
    attachments.map(
      (
        file,
      ) =>
        createAttachmentContent(
          file,
        ),
    );


  content.push({
    type:
      "input_text",

    text:
      input.trim(),
  });


  return [
    {
      role:
        "user",

      content,
    },
  ];
}


function validateAttachmentSize(
  attachments,
) {
  const totalBytes =
    attachments.reduce(
      (
        total,
        file,
      ) =>
        total +
        file.size,
      0,
    );


  if (
    totalBytes >
    MAX_TOTAL_ATTACHMENT_BYTES
  ) {
    const error =
      new Error(
        "Combined attachment size exceeds the application limit.",
      );


    error.code =
      "ATTACHMENTS_TOO_LARGE";


    throw error;
  }
}


/*
 * Builds a real input_file attachment out of
 * an arbitrary JSON-serializable object, so
 * "attach this as a file" is literal — not a
 * text block glued into the main instructions.
 */
function createJsonFileAttachment(
  fileName,
  data,
) {
  const json =
    JSON.stringify(
      data ??
        {},

      null,

      2,
    );


  const base64 =
    Buffer.from(
      json,
      "utf8",
    ).toString(
      "base64",
    );


  return {
    type:
      "input_file",

    filename:
      getSafeFileName(
        fileName,
      ),

    file_data:
      `data:application/json;base64,${base64}`,
  };
}


export {
  uploadAttachments,
  getSafeFileName,
  createAttachmentContent,
  buildInput,
  validateAttachmentSize,
  createJsonFileAttachment,
};
