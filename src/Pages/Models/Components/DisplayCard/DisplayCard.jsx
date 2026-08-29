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
  imagePath,
) {
  if (
    !imagePath
  ) {
    return null;
  }


  const match =
    Object.entries(
      MODEL_IMAGES,
    ).find(
      (
        [
          path,
        ],
      ) =>
        path.endsWith(
          `/${imagePath}`,
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
      model.imagePath,
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
            alt={`${model.displayName} artwork`}
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
          {model.displayName}
        </h2>

        <span className="model-display-card-provider">
          {model.providerLabel}
        </span>

        <p>
          {model.description}
        </p>


        <div className="model-display-card-footer">
          <code>
            {model.name}
          </code>

          <span
            className={`model-display-card-status ${
              model.contentMarkdown
                ? "available"
                : "missing"
            }`}
          >
            {model.contentMarkdown
              ? "READY"
              : "FILE MISSING"}
          </span>
        </div>
      </div>
    </button>
  );
}


export default DisplayCard;
