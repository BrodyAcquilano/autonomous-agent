import "./AgentCard.css";


const AGENT_IMAGES =
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


function getAgentArtwork(
  imagePath,
) {
  if (
    !imagePath
  ) {
    return null;
  }


  const match =
    Object.entries(
      AGENT_IMAGES,
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


function AgentCard({
  agent,
  onClick,
}) {
  const image =
    getAgentArtwork(
      agent.imagePath,
    );


  return (
    <button
      type="button"
      className="agent-display-card"
      onClick={
        onClick
      }
    >
      <div className="agent-display-card-image-frame">
        {image ? (
          <img
            className="agent-display-card-image"
            src={
              image
            }
            alt={`${agent.displayName} artwork`}
          />
        ) : (
          <div className="agent-display-card-image-placeholder">
            <span>
              NO IMAGE
            </span>
          </div>
        )}

        {agent.status && (
          <span className="agent-display-card-status-badge">
            {agent.status}
          </span>
        )}
      </div>


      <div className="agent-display-card-content">
        <h2>
          {agent.displayName}
        </h2>

        <p>
          {agent.description}
        </p>


        <div className="agent-display-card-footer">
          <code>
            {agent.name}
          </code>

          <span
            className={`agent-display-card-prompt-status ${
              agent.contentMarkdown
                ? "available"
                : "missing"
            }`}
          >
            {agent.contentMarkdown
              ? "PROMPT LOADED"
              : "NO PROMPT"}
          </span>
        </div>
      </div>
    </button>
  );
}


export default AgentCard;
