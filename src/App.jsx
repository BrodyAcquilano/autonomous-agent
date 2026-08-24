import {
  useState,
} from "react";

import BottomTabs from "./Components/BottomTabs/BottomTabs";

import "./App.css";


const TABS = [
  "Console",
  "Models",
  "Resources",
  "Memory",
  "Output",
  "Analytics",
];


const TERMINAL_MAN_BANNER = String.raw`
////////////////////////////////////////////////////////////////////////////////

#####  #####  ####   #   #  #####  #   #   ###   #      #   #   ###   #   #
  #    #      #   #  ## ##    #    ##  #  #   #  #      ## ##  #   #  ##  #
  #    ####   ####   # # #    #    # # #  #####  #      # # #  #####  # # #
  #    #      #  #   #   #    #    #  ##  #   #  #      #   #  #   #  #  ##
  #    #####  #   #  #   #  #####  #   #  #   #  #####  #   #  #   #  #   #

////////////////////////////////////////////////////////////////////////////////
`;


const SATELLITE_ART = String.raw`
                         .                 *
          *                                         .
                                  .

                    )))             (((
                       )))       (((
                          ))) (((

                              |
                         \    |    /
                          \   |   /
                           \  |  /
                            \ | /
                             \|/
                             [*]
                              |
                      .-------|-------.
                   .-'        |        '-.
                 .'           |           '.
                /             |             \
               /              |              \
              /               |               \
              \_______________________________/
                              |
                              |
                           ___|___
                         .'       '.
                        /           \
                       /             \
                      /_______________\
                          |       |
                          |   o   |
                          |_______|

                     COMMUNICATION ARRAY
`;


const STAR_FIELD_ONE = String.raw`
       *                       .                       *
                .                         *
   .                                      .                    *
                           *
              *                                      .
                                                *
     .                *              .
`;


const STAR_FIELD_TWO = String.raw`
              .                              *
      *                                              .
                         .         *
                                                   *
   *                  .                                 .
                                 *
            .                           *
`;


function App() {
  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "Console",
  );

  const [
    command,
    setCommand,
  ] = useState("");


  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    console.log(
      "Command:",
      command,
    );
  };


  return (
    <div className="app">
      <main className="main-layer">
        <div
          className="retro-background"
          aria-hidden="true"
        >
          <div className="deep-space-glow" />

          <pre className="terminal-stars terminal-stars-one">
            {STAR_FIELD_ONE}
          </pre>

          <pre className="terminal-stars terminal-stars-two">
            {STAR_FIELD_TWO}
          </pre>

          <div className="scanlines" />
          <div className="screen-vignette" />
        </div>

        <div className="system-status">
          <span className="system-status-light" />

          <span className="system-status-label">
            SYSTEM READY
          </span>
        </div>

        <pre
          className="banner"
          aria-hidden="true"
        >
          {TERMINAL_MAN_BANNER}
        </pre>

        <section className="workspace">
          {activeTab ===
          "Console" ? (
            <div className="console-workspace">
              <div className="terminal-art-wrapper">
                <div className="terminal-art-glow" />

                <pre
                  className="satellite-art"
                  aria-label="Satellite communication array"
                >
                  {SATELLITE_ART}
                </pre>
              </div>
            </div>
          ) : (
            <div className="workspace-panel">
              <div className="workspace-panel-header">
                <span>
                  {activeTab}
                </span>

                <span className="workspace-panel-module">
                  TERMINAL MAN MODULE
                </span>
              </div>

              <div className="workspace-panel-content">
                <div className="workspace-terminal-line">
                  &gt; MODULE:
                  {" "}
                  {activeTab.toUpperCase()}
                </div>

                <h2>
                  {activeTab}
                </h2>

                <p>
                  MODULE AWAITING
                  CONFIGURATION.
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="lower-interface">
          <section className="identity-panel">
            <div className="identity-panel-title">
              TERMINAL MAN
            </div>

            <div className="identity-panel-subtitle">
              AUTONOMOUS CONTROL SYSTEM
            </div>

            <div className="identity-panel-description">
              Enter instructions,
              load a task file,
              or initiate an autonomous
              operation.
            </div>
          </section>

          <form
            className="command-shell"
            onSubmit={
              handleSubmit
            }
          >
            <div className="command-prefix">
              &gt;
            </div>

            <input
              className="command-input"
              type="text"
              value={
                command
              }
              placeholder="ENTER COMMAND OR TASK..."
              onChange={(
                event,
              ) =>
                setCommand(
                  event
                    .target
                    .value,
                )
              }
            />

            <button
              type="button"
              className="command-file-button"
              aria-label="Add input file"
            >
              +
            </button>

            <button
              type="submit"
              className="command-run-button"
            >
              EXECUTE
            </button>
          </form>

          <BottomTabs
            tabs={TABS}
            activeTab={
              activeTab
            }
            setActiveTab={
              setActiveTab
            }
          />
        </div>
      </main>
    </div>
  );
}


export default App;