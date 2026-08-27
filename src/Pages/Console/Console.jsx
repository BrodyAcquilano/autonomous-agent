import ConsoleViewport from "./Components/ConsoleViewport/ConsoleViewport";

import CommandShell from "./Components/CommandShell/CommandShell";
import LightPanel from "./Components/LightPanel/LightPanel";
import MessagePanel from "./Components/MessagePanel/MessagePanel";
import RequestControlPanel from "./Components/RequestControlPanel/RequestControlPanel";

import "./Console.css";


const ROUTER_MODEL_ID =
  "gpt-5.6-terra";


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