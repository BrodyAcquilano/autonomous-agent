import ConsoleViewport from "./Components/ConsoleViewport/ConsoleViewport";

import CommandShell from "./Components/CommandShell/CommandShell";
import LightPanel from "./Components/LightPanel/LightPanel";
import MessagePanel from "./Components/MessagePanel/MessagePanel";
import SuggestedRequestSettingsPanel from "./Components/SuggestedRequestSettingsPanel/SuggestedRequestSettingsPanel";

import "./Console.css";


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

  consoleWidgetSizes,
  setConsoleWidgetSize,

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
            portalTargetRef,
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

                size={
                  consoleWidgetSizes
                    ?.lightPanel
                }

                onSizeChange={(
                  nextSize,
                ) => {
                  setConsoleWidgetSize(
                    "lightPanel",
                    nextSize,
                  );
                }}
              />


              <SuggestedRequestSettingsPanel
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

                size={
                  consoleWidgetSizes
                    ?.requestControlPanel
                }

                onSizeChange={(
                  nextSize,
                ) => {
                  setConsoleWidgetSize(
                    "requestControlPanel",
                    nextSize,
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

                size={
                  consoleWidgetSizes
                    ?.messagePanel
                }

                onSizeChange={(
                  nextSize,
                ) => {
                  setConsoleWidgetSize(
                    "messagePanel",
                    nextSize,
                  );
                }}

                portalTargetRef={
                  portalTargetRef
                }
              />
            </>
          )}
        </ConsoleViewport>
      </div>


      <div className="console-lower-interface">
        <CommandShell
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