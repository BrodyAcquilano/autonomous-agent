import {
  readFile,
  readdir,
} from "node:fs/promises";

import {
  dirname,
  extname,
  relative,
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


const APIS_DIRECTORY =
  resolve(
    __dirname,
    "../../../brain/apis",
  );


function getApiId(
  fileName,
) {
  return fileName.replace(
    /\.md$/i,
    "",
  );
}


function isSafePathPart(
  value,
) {
  return (
    typeof value ===
      "string" &&
    /^[a-zA-Z0-9._-]+$/.test(
      value,
    )
  );
}


async function getMarkdownFiles(
  directory,
) {
  const entries =
    await readdir(
      directory,
      {
        withFileTypes:
          true,
      },
    );


  const files =
    await Promise.all(
      entries.map(
        async (
          entry,
        ) => {
          const entryPath =
            resolve(
              directory,
              entry.name,
            );


          if (
            entry.isDirectory()
          ) {
            return getMarkdownFiles(
              entryPath,
            );
          }


          if (
            entry.isFile() &&
            extname(
              entry.name,
            ).toLowerCase() ===
              ".md"
          ) {
            return [
              entryPath,
            ];
          }


          return [];
        },
      ),
    );


  return files.flat();
}


async function readApiFile(
  filePath,
) {
  const markdown =
    await readFile(
      filePath,
      "utf8",
    );


  const relativePath =
    relative(
      APIS_DIRECTORY,
      filePath,
    );


  const normalizedPath =
    relativePath.replace(
      /\\/g,
      "/",
    );


  const pathParts =
    normalizedPath.split(
      "/",
    );


  const fileName =
    pathParts[
      pathParts.length -
      1
    ];


  const platform =
    pathParts.length >
    1
      ? pathParts[
          pathParts.length -
          2
        ]
      : null;


  const apiId =
    getApiId(
      fileName,
    );


  return {
    apiId,

    apiKey:
      platform
        ? `${platform}/${apiId}`
        : apiId,

    platform,

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
      const markdownFiles =
        await getMarkdownFiles(
          APIS_DIRECTORY,
        );


      const apis =
        await Promise.all(
          markdownFiles.map(
            (
              filePath,
            ) =>
              readApiFile(
                filePath,
              ),
          ),
        );


      apis.sort(
        (
          a,
          b,
        ) =>
          a.apiKey.localeCompare(
            b.apiKey,
          ),
      );


      return res.json({
        apis,
      });
    } catch (
      error
    ) {
      console.error(
        "Failed to load API files:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load API files.",

          message:
            error.message,
        });
    }
  },
);


router.get(
  "/:platform/:apiId",
  async (
    req,
    res,
  ) => {
    try {
      const {
        platform,
        apiId,
      } = req.params;


      if (
        !isSafePathPart(
          platform,
        ) ||
        !isSafePathPart(
          apiId,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid API path.",
          });
      }


      const filePath =
        resolve(
          APIS_DIRECTORY,
          platform,
          `${apiId}.md`,
        );


      const api =
        await readApiFile(
          filePath,
        );


      return res.json({
        api,
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
              "API file not found.",
          });
      }


      console.error(
        "Failed to load API file:",
        error,
      );


      return res
        .status(500)
        .json({
          error:
            "Failed to load API file.",

          message:
            error.message,
        });
    }
  },
);


export default router;