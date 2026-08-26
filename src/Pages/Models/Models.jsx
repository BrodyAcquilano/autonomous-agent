import {
  useEffect,
  useMemo,
  useState,
} from "react";

import modelsApi from "../../Api/Models/models";

import DisplayCard from "./Components/DisplayCard/DisplayCard";
import ModelInfoModal from "./Components/ModelInfoModal/ModelInfoModal";

import "./Models.css";


const MODEL_CATALOG = [
  {
    modelId:
      "gpt-5.6-terra",

    name:
      "GPT-5.6 Terra",

    provider:
      "OpenAI · Azure OpenAI",

    category:
      "GENERAL REASONING",

    description:
      "Balanced reasoning, long-context analysis, tool use, and general-purpose agent workflows.",
  },

  {
    modelId:
      "gpt-5.3-codex",

    name:
      "GPT-5.3 Codex",

    provider:
      "OpenAI · Azure OpenAI",

    category:
      "SOFTWARE DEVELOPMENT",

    description:
      "Coding-focused reasoning for repository analysis, development, debugging, refactoring, and testing.",
  },

  {
    modelId:
      "gpt-image-2",

    name:
      "GPT-Image-2",

    provider:
      "OpenAI · Azure OpenAI",

    category:
      "IMAGE GENERATION",

    description:
      "Image generation and editing from text and image inputs with flexible visual output.",
  },
];


function Models() {
  const [
    modelFiles,
    setModelFiles,
  ] = useState([]);


  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(
    null,
  );


  const [
    isLoading,
    setIsLoading,
  ] = useState(
    true,
  );


  const [
    error,
    setError,
  ] = useState(
    null,
  );


  useEffect(
    () => {
      let mounted =
        true;


      const loadModels =
        async () => {
          try {
            const files =
              await modelsApi.getAll();


            if (
              mounted
            ) {
              setModelFiles(
                files,
              );

              setError(
                null,
              );
            }
          } catch (
            loadError
          ) {
            console.error(
              "Failed to load models:",
              loadError,
            );


            if (
              mounted
            ) {
              setError(
                loadError
                  .response
                  ?.data
                  ?.message ||
                loadError.message ||
                "Failed to load model files.",
              );
            }
          } finally {
            if (
              mounted
            ) {
              setIsLoading(
                false,
              );
            }
          }
        };


      loadModels();


      return () => {
        mounted =
          false;
      };
    },
    [],
  );


  const models =
    useMemo(
      () => {
        const filesByModelId =
          new Map(
            modelFiles.map(
              (
                file,
              ) => [
                file.modelId,
                file,
              ],
            ),
          );


        return MODEL_CATALOG.map(
          (
            definition,
          ) => {
            const file =
              filesByModelId.get(
                definition.modelId,
              );


            return {
              ...definition,

              fileName:
                file?.fileName ||
                null,

              markdown:
                file?.markdown ||
                null,
            };
          },
        );
      },
      [
        modelFiles,
      ],
    );


  const selectedModel =
    selectedIndex !==
      null
      ? models[
          selectedIndex
        ]
      : null;


  function handlePrevious() {
    setSelectedIndex(
      (
        currentIndex,
      ) => {
        if (
          currentIndex ===
          null
        ) {
          return 0;
        }


        return (
          currentIndex -
          1 +
          models.length
        ) %
        models.length;
      },
    );
  }


  function handleNext() {
    setSelectedIndex(
      (
        currentIndex,
      ) => {
        if (
          currentIndex ===
          null
        ) {
          return 0;
        }


        return (
          currentIndex +
          1
        ) %
        models.length;
      },
    );
  }


  return (
    <main
      className="models-page"
      role="region"
      aria-label="Models"
    >
      <header className="models-page-header">
        <span className="models-page-eyebrow">
          TERMINAL MAN / MODEL CATALOG
        </span>

        <h1>
          Models
        </h1>

        <p>
          Browse the models available
          to Terminal Man and inspect
          their capabilities,
          deployment details, APIs,
          limits, and intended uses.
        </p>
      </header>


      {isLoading && (
        <div className="models-page-message">
          Loading model catalog...
        </div>
      )}


      {error && (
        <div className="models-page-error">
          <strong>
            MODEL CATALOG ERROR
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}


      {!isLoading && (
        <section
          className="models-catalog"
          aria-label="Available models"
        >
          {models.map(
            (
              model,
              index,
            ) => (
              <DisplayCard
                key={
                  model.modelId
                }
                model={
                  model
                }
                onClick={() => {
                  setSelectedIndex(
                    index,
                  );
                }}
              />
            ),
          )}
        </section>
      )}


      {selectedModel && (
        <ModelInfoModal
          model={
            selectedModel
          }
          modelIndex={
            selectedIndex
          }
          modelCount={
            models.length
          }
          onClose={() => {
            setSelectedIndex(
              null,
            );
          }}
          onPrevious={
            handlePrevious
          }
          onNext={
            handleNext
          }
        />
      )}
    </main>
  );
}


export default Models;