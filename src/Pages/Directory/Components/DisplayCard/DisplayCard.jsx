import "./DisplayCard.css";


/*
 * Deliberately points at the Agents page's own
 * Images folder rather than a copy under this
 * page — there is only one set of agent
 * portraits, and duplicating them per page
 * isn't worth it. This crosses the usual
 * page-isolation convention on purpose; once
 * images move to real object storage (e.g.
 * Cloudflare), both pages will resolve
 * imagePath against that instead and this
 * cross-page import goes away.
 */
const AGENT_IMAGES =
  import.meta.glob(
    "../../../Agents/Images/**/*.{png,jpg,jpeg,webp}",
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


function DisplayCard({
  agent,
  contacts,
  onClick,
}) {
  const image =
    getAgentArtwork(
      agent.imagePath,
    );


  const serviceCount =
    contacts.filter(
      (
        contact,
      ) =>
        contact.callerId ===
        agent.agentId,
    ).length;


  return (
    <button
      type="button"
      className="directory-display-card"
      onClick={
        onClick
      }
    >
      <div className="directory-display-card-image-frame">
        {image ? (
          <img
            className="directory-display-card-image"
            src={
              image
            }
            alt={`${agent.displayName} artwork`}
          />
        ) : (
          <div className="directory-display-card-image-placeholder">
            <span>
              NO IMAGE
            </span>
          </div>
        )}

        {agent.status && (
          <span className="directory-display-card-status-badge">
            {agent.status}
          </span>
        )}
      </div>


      <div className="directory-display-card-content">
        <h2>
          {agent.displayName}
        </h2>

        <p>
          {agent.description}
        </p>


        <div className="directory-display-card-footer">
          <code>
            {agent.agentId}
          </code>

          <span className="directory-display-card-service-count">
            {serviceCount}
            {" "}
            {serviceCount ===
            1
              ? "SERVICE"
              : "SERVICES"}
          </span>
        </div>
      </div>
    </button>
  );
}


export default DisplayCard;
