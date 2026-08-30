import {
  useEffect,
  useMemo,
} from "react";

import "./DirectoryInfoModal.css";


/*
 * Deliberately points at the Agents page's own
 * Images folder rather than a copy under this
 * page — there is only one set of agent
 * portraits, and duplicating them per page
 * isn't worth it. This crosses the usual
 * page-isolation convention on purpose; once
 * images move to real object storage (e.g.
 * Cloudflare), both pages will resolve
 * imagePath/profileImagePath against that
 * instead and this cross-page import goes away.
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


function FieldRow({
  label,
  value,
}) {
  const isEmpty =
    value ===
      undefined ||
    value ===
      null ||
    value ===
      "" ||
    (
      Array.isArray(
        value,
      ) &&
      !value.length
    );


  if (
    isEmpty
  ) {
    return null;
  }


  return (
    <div className="directory-field-row">
      <span className="directory-field-label">
        {label}
      </span>

      <span className="directory-field-value">
        {Array.isArray(
          value,
        )
          ? value.join(
              ", ",
            )
          : String(
              value,
            )}
      </span>
    </div>
  );
}


/*
 * Three layers, one stack — Agent (root) ->
 * Contact (an outgoing edge) -> Request Type
 * (one entry from that edge's requestTypes
 * array). Unlike ModelInfoModal, request-type
 * entries have no _id of their own (they are
 * plain objects embedded in a request_types
 * document's array), so a pushed "requestType"
 * view is identified by {callerId, calleeId,
 * name} rather than a single id.
 */
function DirectoryInfoModal({
  agent,
  agentIndex,
  agentCount,
  contacts,
  requestTypes,
  stack,
  setStack,
  onClose,
  onPrevious,
  onNext,
}) {
  const view =
    stack.length
      ? stack[
          stack.length -
          1
        ]
      : {
          type:
            "agent",
        };


  function pushView(
    nextView,
  ) {
    setStack(
      (
        current,
      ) => [
        ...current,
        nextView,
      ],
    );
  }


  function goBack() {
    setStack(
      (
        current,
      ) =>
        current.slice(
          0,
          -1,
        ),
    );
  }


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
            if (
              stack.length ===
              0
            ) {
              onPrevious();
            }

            break;


          case "ArrowRight":
            if (
              stack.length ===
              0
            ) {
              onNext();
            }

            break;


          case "Backspace":
            if (
              stack.length >
              0
            ) {
              goBack();
            }

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
      stack.length,
    ],
  );


  const agentContacts =
    useMemo(
      () =>
        contacts.filter(
          (
            contact,
          ) =>
            contact.callerId ===
            agent.agentId,
        ),
      [
        contacts,
        agent.agentId,
      ],
    );


  let eyebrow =
    "AGENT";

  let title =
    agent.displayName;

  let contact =
    null;

  let contactRequestTypesDoc =
    null;

  let requestTypeEntry =
    null;


  if (
    view.type ===
    "contact"
  ) {
    contact =
      contacts.find(
        (
          item,
        ) =>
          item._id ===
          view.id,
      ) ||
      null;

    eyebrow =
      "CONTACT";

    title =
      contact?.calleeId ||
      "Contact";

    contactRequestTypesDoc =
      requestTypes.find(
        (
          item,
        ) =>
          item.callerId ===
            contact?.callerId &&
          item.calleeId ===
            contact?.calleeId,
      ) ||
      null;
  } else if (
    view.type ===
    "requestType"
  ) {
    contactRequestTypesDoc =
      requestTypes.find(
        (
          item,
        ) =>
          item.callerId ===
            view.callerId &&
          item.calleeId ===
            view.calleeId,
      ) ||
      null;

    requestTypeEntry =
      contactRequestTypesDoc?.requestTypes.find(
        (
          item,
        ) =>
          item.name ===
          view.name,
      ) ||
      null;

    eyebrow =
      "REQUEST TYPE";

    title =
      requestTypeEntry?.name ||
      "Request Type";
  }


  const image =
    getAgentArtwork(
      agent.profileImagePath,
    );


  return (
    <div
      className="directory-modal-backdrop"
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
        className="directory-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} directory entry`}
      >
        <header className="directory-modal-header">
          <div className="directory-modal-heading">
            <span className="directory-modal-eyebrow">
              {eyebrow}
            </span>

            <h1>
              {title}
            </h1>

            {view.type ===
            "agent" ? (
              <span className="directory-modal-position">
                {agentIndex + 1}
                {" / "}
                {agentCount}
              </span>
            ) : (
              <button
                type="button"
                className="directory-modal-back"
                onClick={
                  goBack
                }
              >
                ‹ BACK
              </button>
            )}
          </div>


          <button
            type="button"
            className="directory-modal-close"
            aria-label="Close directory entry"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        {view.type ===
          "agent" && (
          <button
            type="button"
            className="directory-modal-arrow directory-modal-arrow-left"
            aria-label="Previous agent"
            onClick={
              onPrevious
            }
          >
            ‹
          </button>
        )}


        <div className="directory-modal-document">
          {view.type ===
            "agent" && (
            <>
              <div className="directory-profile-card">
                <div className="directory-profile-card-image-frame">
                  {image ? (
                    <img
                      className="directory-profile-card-image"
                      src={
                        image
                      }
                      alt={`${agent.displayName} artwork`}
                    />
                  ) : (
                    <div className="directory-profile-card-image-placeholder">
                      <span>
                        NO IMAGE
                      </span>
                    </div>
                  )}
                </div>


                <div className="directory-profile-card-details">
                  <h2>
                    {agent.displayName}
                  </h2>

                  <code className="directory-profile-card-name">
                    {agent.agentId}
                  </code>

                  <p className="directory-profile-card-description">
                    {agent.description}
                  </p>
                </div>
              </div>


              <section className="directory-related-links">
                <div className="directory-related-links-title">
                  SERVICES THIS AGENT CAN CALL
                </div>

                <div className="directory-related-links-list">
                  {agentContacts.length ===
                    0 && (
                    <span className="directory-related-links-empty">
                      No outgoing contacts configured.
                    </span>
                  )}

                  {agentContacts.map(
                    (
                      item,
                    ) => (
                      <button
                        key={
                          item._id
                        }
                        type="button"
                        className="directory-related-link"
                        onClick={() => {
                          pushView({
                            type:
                              "contact",

                            id:
                              item._id,
                          });
                        }}
                      >
                        {item.calleeId}

                        <span className="directory-related-link-sub">
                          {item.serviceType ||
                            item.calleeType}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </section>
            </>
          )}


          {view.type ===
            "contact" &&
            (
              contact ? (
                <>
                  <div className="directory-fields">
                    <FieldRow
                      label="CALLER"
                      value={
                        contact.callerId
                      }
                    />

                    <FieldRow
                      label="CALLEE"
                      value={
                        contact.calleeId
                      }
                    />

                    <FieldRow
                      label="CALLEE TYPE"
                      value={
                        contact.calleeType
                      }
                    />

                    <FieldRow
                      label="SERVICE TYPE"
                      value={
                        contact.serviceType
                      }
                    />

                    <FieldRow
                      label="OPERATION"
                      value={
                        contact.operation
                      }
                    />

                    <FieldRow
                      label="DATABASE"
                      value={
                        contact.database
                      }
                    />

                    <FieldRow
                      label="STATUS"
                      value={
                        contact.status
                      }
                    />
                  </div>


                  <p className="directory-description-block">
                    {contact.description}
                  </p>


                  <section className="directory-related-links">
                    <div className="directory-related-links-title">
                      REQUEST TYPES ON THIS CONTACT
                    </div>

                    <div className="directory-related-links-list">
                      {(
                        !contactRequestTypesDoc ||
                        !contactRequestTypesDoc.requestTypes.length
                      ) && (
                        <span className="directory-related-links-empty">
                          No request types configured for this contact.
                        </span>
                      )}

                      {contactRequestTypesDoc?.requestTypes.map(
                        (
                          entry,
                        ) => (
                          <button
                            key={
                              entry.name
                            }
                            type="button"
                            className="directory-related-link"
                            onClick={() => {
                              pushView({
                                type:
                                  "requestType",

                                callerId:
                                  contact.callerId,

                                calleeId:
                                  contact.calleeId,

                                name:
                                  entry.name,
                              });
                            }}
                          >
                            {entry.name}
                          </button>
                        ),
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div className="directory-markdown-missing">
                  <h2>
                    Contact not found
                  </h2>
                </div>
              )
            )}


          {view.type ===
            "requestType" &&
            (
              requestTypeEntry ? (
                <div className="directory-fields">
                  <FieldRow
                    label="NAME"
                    value={
                      requestTypeEntry.name
                    }
                  />

                  <FieldRow
                    label="OPERATION"
                    value={
                      requestTypeEntry.operation
                    }
                  />

                  <FieldRow
                    label="DATABASE"
                    value={
                      requestTypeEntry.database
                    }
                  />

                  <FieldRow
                    label="COLLECTION"
                    value={
                      requestTypeEntry.collection
                    }
                  />

                  <FieldRow
                    label="FIELDS AFFECTED"
                    value={
                      requestTypeEntry.fieldsAffected
                    }
                  />

                  <p className="directory-description-block">
                    {requestTypeEntry.description}
                  </p>
                </div>
              ) : (
                <div className="directory-markdown-missing">
                  <h2>
                    Request type not found
                  </h2>
                </div>
              )
            )}
        </div>


        {view.type ===
          "agent" && (
          <button
            type="button"
            className="directory-modal-arrow directory-modal-arrow-right"
            aria-label="Next agent"
            onClick={
              onNext
            }
          >
            ›
          </button>
        )}
      </section>
    </div>
  );
}


export default DirectoryInfoModal;
