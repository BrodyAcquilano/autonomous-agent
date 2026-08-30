import AgentCard from "./Components/AgentCard/AgentCard";
import AgentInfoModal from "./Components/AgentInfoModal/AgentInfoModal";

import "./Agents.css";


/*
 * Unlike Capabilities.jsx, this page has no
 * branching modal stack — agent profile
 * documents are a flat vector (a "Team" page),
 * not a linked funnel, so the modal only ever
 * shows one agent's own document with simple
 * previous/next navigation. See
 * docs/architecture/03-agent-organization.md.
 */
function Agents({
  agents,
  agentsLoading,
  agentsError,
  selectedAgentId,
  setSelectedAgentId,
}) {
  const selectedIndex =
    selectedAgentId
      ? agents.findIndex(
          (
            agent,
          ) =>
            agent._id ===
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


    setSelectedAgentId(
      agents[
        nextIndex
      ]._id,
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


    setSelectedAgentId(
      agents[
        nextIndex
      ]._id,
    );
  }


  return (
    <main
      className="agents-page"
      role="region"
      aria-label="Agents"
    >
      <header className="agents-page-header">
        <span className="agents-page-eyebrow">
          MEET THE TEAM
        </span>

        <h1>
          Agents
        </h1>

        <p>
          Meet the standing agents behind
          the company — who they are, what
          they do, and the exact prompt
          each one runs on.
        </p>
      </header>


      {agentsLoading && (
        <div className="agents-page-message">
          Loading agent roster...
        </div>
      )}


      {agentsError && (
        <div className="agents-page-error">
          <strong>
            AGENT ROSTER ERROR
          </strong>

          <span>
            {agentsError}
          </span>
        </div>
      )}


      {!agentsLoading &&
        !agentsError && (
        <section
          className="agents-catalog"
          aria-label="Agent roster"
        >
          {agents.map(
            (
              agent,
            ) => (
              <AgentCard
                key={
                  agent._id
                }
                agent={
                  agent
                }
                onClick={() => {
                  setSelectedAgentId(
                    agent._id,
                  );
                }}
              />
            ),
          )}
        </section>
      )}


      {selectedAgent && (
        <AgentInfoModal
          agent={
            selectedAgent
          }
          agentIndex={
            selectedIndex
          }
          agentCount={
            agents.length
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


export default Agents;
