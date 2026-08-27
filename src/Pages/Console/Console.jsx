import ConsoleViewport from "./Components/ConsoleViewport/ConsoleViewport";

import CommandShell from "./Components/CommandShell/CommandShell";
import CommunicationArray from "./Components/CommunicationArray/CommunicationArray";
import LightPanel from "./Components/LightPanel/LightPanel";
import MessagePanel from "./Components/MessagePanel/MessagePanel";
import RequestControlPanel from "./Components/RequestControlPanel/RequestControlPanel";

import "./Console.css";


const ROUTER_MODEL_ID =
  "gpt-5.6-terra";


const TERMINAL_MAN_BANNER = String.raw`
////////////////////////////////////////////////////////////////////////////////

#####  #####  ####   #   #  #####  #   #   ###   #      #   #   ###   #   #
  #    #      #   #  ## ##    #    ##  #  #   #  #      ## ##  #   #  ##  #
  #    ####   ####   # # #    #    # # #  #####  #      # # #  #####  # # #
  #    #      #  #   #   #    #    #  ##  #   #  #      #   #  #   #  #  ##
  #    #####  #   #  #   #  #####  #   #  #   #  #####  #   #  #   #  #   #

////////////////////////////////////////////////////////////////////////////////
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


function Console({
  messages,
  setMessages,
  setResponse,

  systemStatus,
  setSystemStatus,

  reportError,

  requestSettings,
  setRequestSettings,

  consoleWidgetOffsets,
  setConsoleWidgetOffset,

  viewportView,
  setViewportView,
}) {
  return (
    <main className="console-page">
      <div className="console-viewport-layer">
        <ConsoleViewport
          view={
            viewportView
          }
          onViewChange={
            setViewportView
          }
        >
          {({
            boundsRef,
            scale,
          }) => (
            <>
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


              <pre
                className="terminal-man-banner"
                aria-hidden="true"
              >
                {TERMINAL_MAN_BANNER}
              </pre>


              <section className="console-workspace">
                <CommunicationArray />
              </section>


              <LightPanel
                systemStatus={
                  systemStatus
                }

                boundsRef={
                  boundsRef
                }

                scale={
                  scale
                }

                offset={
                  consoleWidgetOffsets
                    ?.lightPanel
                }

                onOffsetChange={(
                  nextOffset,
                ) => {
                  setConsoleWidgetOffset(
                    "lightPanel",
                    nextOffset,
                  );
                }}
              />


              <RequestControlPanel
                model={
                  ROUTER_MODEL_ID
                }

                requestSettings={
                  requestSettings
                }
                setRequestSettings={
                  setRequestSettings
                }

                boundsRef={
                  boundsRef
                }

                scale={
                  scale
                }

                offset={
                  consoleWidgetOffsets
                    ?.requestControlPanel
                }

                onOffsetChange={(
                  nextOffset,
                ) => {
                  setConsoleWidgetOffset(
                    "requestControlPanel",
                    nextOffset,
                  );
                }}
              />


              <MessagePanel
                messages={
                  messages
                }

                boundsRef={
                  boundsRef
                }

                scale={
                  scale
                }

                offset={
                  consoleWidgetOffsets
                    ?.messagePanel
                }

                onOffsetChange={(
                  nextOffset,
                ) => {
                  setConsoleWidgetOffset(
                    "messagePanel",
                    nextOffset,
                  );
                }}
              />
            </>
          )}
        </ConsoleViewport>
      </div>


      <div className="console-lower-interface">
        <CommandShell
          model={
            ROUTER_MODEL_ID
          }

          requestSettings={
            requestSettings
          }

          setMessages={
            setMessages
          }
          setResponse={
            setResponse
          }

          setSystemStatus={
            setSystemStatus
          }

          reportError={
            reportError
          }
        />
      </div>
    </main>
  );
}


export default Console;