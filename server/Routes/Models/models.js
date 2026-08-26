import {
  readFile,
  readdir,
} from "node:fs/promises";

import {
  dirname,
  extname,
  resolve,
} from "node:path";

import {
  fileURLToPath,
} from "node:url";

import express from "express";


const router =
  express.Router();


const __filename =
  fileURLToPath(
    import.meta.url,
  );

const __dirname =
  dirname(
    __filename,
  );


const MODELS_DIRECTORY =
  resolve(
    __dirname,
    "../../../brain/models",
  );


function getModelId(
  fileName,
) {
  return fileName.replace(
    /\.md$/i,
    "",
  );
}


function isSafeModelId(
  modelId,
) {
  return (
    typeof modelId ===
      "string" &&
    /^[a-zA-Z0-9._-]+$/.test(
      modelId,
    )
  );
}


async function readModelFile(
  fileName,
) {
  const filePath =
    resolve(
      MODELS_DIRECTORY,
      fileName,
    );


  const markdown =
    await readFile(
      filePath,
      "utf8",
    );


  return {
    modelId:
      getModelId(
        fileName,
      ),

    fileName,

    markdown,
  };
}


router.get(
  "/",
  async (
    req,
    res,
  ) => {
    try {
      const files =
        await readdir(
          MODELS_DIRECTORY,
        );


      const markdownFiles =
        files
          .filter(
            (
              fileName,
            ) =>
              extname(
                fileName,
              ).toLowerCase() ===
              ".md",
          )
          .sort();


      const models =
        await Promise.all(
          markdownFiles.map(
            (
              fileName,
            ) =>
              readModelFile(
                fileName,
              ),
          ),
        );


      return res.json({
        models,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load model files:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load model files.",

          message:
            error.message,
        });
    }
  },
);


router.get(
  "/:modelId",
  async (
    req,
    res,
  ) => {
    try {
      const {
        modelId,
      } = req.params;


      if (
        !isSafeModelId(
          modelId,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid model ID.",
          });
      }


      const fileName =
        `${modelId}.md`;


      const model =
        await readModelFile(
          fileName,
        );


      return res.json({
        model,
      });
    } catch (
      error
    ) {
      if (
        error.code ===
        "ENOENT"
      ) {
        return res
          .status(404)
          .json({
            error:
              "Model file not found.",
          });
      }


      console.error(
        "Failed to load model file:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load model file.",

          message:
            error.message,
        });
    }
  },
);


export default router;