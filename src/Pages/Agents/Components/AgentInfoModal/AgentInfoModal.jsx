import {
  useEffect,
} from "react";

import ReactMarkdown from "react-markdown";

import "./AgentInfoModal.css";


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


/*
 * Agent profile documents are a flat vector,
 * not linked to anything else (see
 * docs/architecture/03-agent-organization.md),
 * so unlike ModelInfoModal this never branches
 * into a stack of nested documents — it always
 * shows exactly one agent's own profile card
 * plus its full contentMarkdown prompt, with
 * simple previous/next navigation across the
 * whole roster.
 */
function AgentInfoModal({
  agent,
  agentIndex,
  agentCount,
  onClose,
  onPrevious,
  onNext,
}) {
  useEffect(
    () => {
      const handleKeyDown = (
        event,
      ) => {
        switch (
          event.key
        ) {
          case "Escape":
            onClose();

            break;


          case "ArrowLeft":
            onPrevious();

            break;


          case "ArrowRight":
            onNext();

            break;


          default:
            break;
        }
      };


      window.addEventListener(
        "keydown",
        handleKeyDown,
      );


      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      onClose,
      onPrevious,
      onNext,
    ],
  );


  /*
   * A distinct field from the grid card's
   * imagePath — the card uses a wide "hero"
   * shot, the profile card here uses a closer
   * square portrait of the same character.
   */
  const image =
    getAgentArtwork(
      agent.profileImagePath,
    );


  return (
    <div
      className="agent-modal-backdrop"
      role="presentation"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="agent-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${agent.displayName} profile`}
      >
        <header className="agent-modal-header">
          <div className="agent-modal-heading">
            <span className="agent-modal-eyebrow">
              AGENT PROFILE
            </span>

            <h1>
              {agent.displayName}
            </h1>

            <span className="agent-modal-position">
              {agentIndex + 1}
              {" / "}
              {agentCount}
            </span>
          </div>


          <button
            type="button"
            className="agent-modal-close"
            aria-label="Close agent profile"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <button
          type="button"
          className="agent-modal-arrow agent-modal-arrow-left"
          aria-label="Previous agent"
          onClick={
            onPrevious
          }
        >
          ‹
        </button>


        <div className="agent-modal-document">
          <div className="agent-profile-card">
            <div className="agent-profile-card-image-frame">
              {image ? (
                <img
                  className="agent-profile-card-image"
                  src={
                    image
                  }
                  alt={`${agent.displayName} artwork`}
                />
              ) : (
                <div className="agent-profile-card-image-placeholder">
                  <span>
                    NO IMAGE
                  </span>
                </div>
              )}
            </div>


            <div className="agent-profile-card-details">
              <h2>
                {agent.displayName}
              </h2>

              <code className="agent-profile-card-name">
                {agent.name}
              </code>

              <p className="agent-profile-card-description">
                {agent.description}
              </p>

              {agent.role && (
                <p className="agent-profile-card-role">
                  {agent.role}
                </p>
              )}
            </div>
          </div>


          {agent.contentMarkdown ? (
            <div className="agent-markdown">
              <ReactMarkdown>
                {agent.contentMarkdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="agent-markdown-missing">
              <h2>
                No prompt on file
              </h2>

              <p>
                This agent has no{" "}
                <code>
                  contentMarkdown
                </code>{" "}
                stored yet.
              </p>
            </div>
          )}
        </div>


        <button
          type="button"
          className="agent-modal-arrow agent-modal-arrow-right"
          aria-label="Next agent"
          onClick={
            onNext
          }
        >
          ›
        </button>
      </section>
    </div>
  );
}


export default AgentInfoModal;
