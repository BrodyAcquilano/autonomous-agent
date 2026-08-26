import "./DisplayCard.css";


const MODEL_IMAGES =
  import.meta.glob(
    "../../Images/**/*.{png,jpg,jpeg,webp}",
    {
      eager: true,

      query:
        "?url",

      import:
        "default",
    },
  );


function getModelArtwork(
  modelId,
) {
  if (
    !modelId
  ) {
    return null;
  }


  const expectedCardNames = [
    `/${modelId}-card.png`,
    `/${modelId}-card.jpg`,
    `/${modelId}-card.jpeg`,
    `/${modelId}-card.webp`,

    `/${modelId}.png`,
    `/${modelId}.jpg`,
    `/${modelId}.jpeg`,
    `/${modelId}.webp`,
  ];


  const match =
    Object.entries(
      MODEL_IMAGES,
    ).find(
      (
        [
          path,
        ],
      ) =>
        expectedCardNames.some(
          (
            fileName,
          ) =>
            path.endsWith(
              fileName,
            ),
        ),
    );


  return (
    match?.[1] ||
    null
  );
}


function DisplayCard({
  model,
  onClick,
}) {
  const image =
    getModelArtwork(
      model.modelId,
    );


  return (
    <button
      type="button"
      className="model-display-card"
      onClick={
        onClick
      }
    >
      <div className="model-display-card-image-frame">
        {image ? (
          <img
            className="model-display-card-image"
            src={
              image
            }
            alt={`${model.name} artwork`}
          />
        ) : (
          <div className="model-display-card-image-placeholder">
            <span>
              NO IMAGE
            </span>
          </div>
        )}

        <span className="model-display-card-category">
          {model.category}
        </span>
      </div>


      <div className="model-display-card-content">
        <h2>
          {model.name}
        </h2>

        <span className="model-display-card-provider">
          {model.provider}
        </span>

        <p>
          {model.description}
        </p>


        <div className="model-display-card-footer">
          <code>
            {model.modelId}
          </code>

          <span
            className={`model-display-card-status ${
              model.markdown
                ? "available"
                : "missing"
            }`}
          >
            {model.markdown
              ? "READY"
              : "FILE MISSING"}
          </span>
        </div>
      </div>
    </button>
  );
}


export default DisplayCard;