import DisplayCard from "./Components/DisplayCard/DisplayCard";
import DirectoryInfoModal from "./Components/DirectoryInfoModal/DirectoryInfoModal";

import "./Directory.css";


/*
 * The Directory is a three-layer structural
 * tensor — Agent -> Contact -> Request Types —
 * distinct from the four-layer Capabilities
 * Brain funnel (Capabilities.jsx) and from the
 * flat, unlinked Agents "Team" roster
 * (Agents.jsx). Layer 1 (agent) is what this
 * page's cards browse; layers 2 and 3 only ever
 * appear inside the modal's branching stack.
 */
function Directory({
  directory,
  directoryLoading,
  directoryError,
  selectedAgentId,
  setSelectedAgentId,
  modalStack,
  setModalStack,
}) {
  const agents =
    directory.agents;


  const selectedIndex =
    selectedAgentId
      ? agents.findIndex(
          (
            agent,
          ) =>
            agent.agentId ===
            selectedAgentId,
        )
      : null;

  const selectedAgent =
    selectedIndex !==
      null &&
    selectedIndex !==
      -1
      ? agents[
          selectedIndex
        ]
      : null;


  function selectAgent(
    agentId,
  ) {
    setSelectedAgentId(
      agentId,
    );

    setModalStack(
      [],
    );
  }


  function handlePrevious() {
    if (
      !agents.length
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
        agents.length
      ) %
      agents.length;


    selectAgent(
      agents[
        nextIndex
      ].agentId,
    );
  }


  function handleNext() {
    if (
      !agents.length
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
      agents.length;


    selectAgent(
      agents[
        nextIndex
      ].agentId,
    );
  }


  return (
    <main
      className="directory-page"
      role="region"
      aria-label="Directory"
    >
      <header className="directory-page-header">
        <span className="directory-page-eyebrow">
          ORGANIZATIONAL BRAIN
        </span>

        <h1>
          Directory
        </h1>

        <p>
          See which agents may call
          which other agents, databases,
          or human review points — and
          exactly what each of those
          calls is allowed to do.
        </p>
      </header>


      {directoryLoading && (
        <div className="directory-page-message">
          Loading directory...
        </div>
      )}


      {directoryError && (
        <div className="directory-page-error">
          <strong>
            DIRECTORY ERROR
          </strong>

          <span>
            {directoryError}
          </span>
        </div>
      )}


      {!directoryLoading &&
        !directoryError && (
        <section
          className="directory-catalog"
          aria-label="Agent directory"
        >
          {agents.map(
            (
              agent,
            ) => (
              <DisplayCard
                key={
                  agent.agentId
                }
                agent={
                  agent
                }
                contacts={
                  directory.contacts
                }
                onClick={() => {
                  selectAgent(
                    agent.agentId,
                  );
                }}
              />
            ),
          )}
        </section>
      )}


      {selectedAgent && (
        <DirectoryInfoModal
          agent={
            selectedAgent
          }
          agentIndex={
            selectedIndex
          }
          agentCount={
            agents.length
          }
          contacts={
            directory.contacts
          }
          requestTypes={
            directory.requestTypes
          }
          stack={
            modalStack
          }
          setStack={
            setModalStack
          }
          onClose={() => {
            setSelectedAgentId(
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


export default Directory;
