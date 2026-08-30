import DisplayCard from "./Components/DisplayCard/DisplayCard";
import ModelInfoModal from "./Components/ModelInfoModal/ModelInfoModal";

import "./Capabilities.css";


function Capabilities({
  models,
  apis,
  modelsLoading,
  modelsError,
  selectedModelId,
  setSelectedModelId,
  modelModalStack,
  setModelModalStack,
  toolsCatalog,
  capabilitiesCatalog,
}) {
  const selectedModel =
    selectedModelId
      ? models.find(
          (
            model,
          ) =>
            model._id ===
            selectedModelId,
        ) ||
        null
      : null;


  const selectedIndex =
    selectedModel
      ? models.findIndex(
          (
            model,
          ) =>
            model._id ===
            selectedModelId,
        )
      : null;


  function selectModel(
    modelId,
  ) {
    setSelectedModelId(
      modelId,
    );

    setModelModalStack(
      [],
    );
  }


  function handlePrevious() {
    if (
      !models.length
    ) {
      return;
    }


    const currentIndex =
      selectedIndex ??
      0;


    const nextIndex =
      (
        currentIndex -
        1 +
        models.length
      ) %
      models.length;


    selectModel(
      models[
        nextIndex
      ]._id,
    );
  }


  function handleNext() {
    if (
      !models.length
    ) {
      return;
    }


    const currentIndex =
      selectedIndex ??
      0;


    const nextIndex =
      (
        currentIndex +
        1
      ) %
      models.length;


    selectModel(
      models[
        nextIndex
      ]._id,
    );
  }


  return (
    <main
      className="models-page"
      role="region"
      aria-label="Capabilities"
    >
      <header className="models-page-header">
        <span className="models-page-eyebrow">
          CAPABILITIES BRAIN
        </span>

        <h1>
          Capabilities
        </h1>

        <p>
          Browse the models available
          and inspect their
          capabilities, deployment
          details, APIs, tools, and
          capabilities.
        </p>
      </header>


      {modelsLoading && (
        <div className="models-page-message">
          Loading model catalog...
        </div>
      )}


      {modelsError && (
        <div className="models-page-error">
          <strong>
            MODEL CATALOG ERROR
          </strong>

          <span>
            {modelsError}
          </span>
        </div>
      )}


      {!modelsLoading && (
        <section
          className="models-catalog"
          aria-label="Available models"
        >
          {models.map(
            (
              model,
            ) => (
              <DisplayCard
                key={
                  model._id
                }
                model={
                  model
                }
                onClick={() => {
                  selectModel(
                    model._id,
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
          apis={
            apis
          }
          toolsCatalog={
            toolsCatalog
          }
          capabilitiesCatalog={
            capabilitiesCatalog
          }
          stack={
            modelModalStack
          }
          setStack={
            setModelModalStack
          }
          onClose={() => {
            setSelectedModelId(
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


export default Capabilities;
