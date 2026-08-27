import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import useRuntime from "./Runtime/Runtime";

import NavigationTabs from "./Components/NavigationTabs/NavigationTabs";

import Analytics from "./Pages/Analytics/Analytics";
import Console from "./Pages/Console/Console";
import Memory from "./Pages/Memory/Memory";
import Models from "./Pages/Models/Models";
import Output from "./Pages/Output/Output";
import Resources from "./Pages/Resources/Resources";

import "./App.css";


function App() {
  const {
    messages,
    setMessages,

    setResponse,

    outputFiles,
    outputFileTypes,

    systemStatus,
    setSystemStatus,

    reportError,

    requestSettings,
    setRequestSettings,

    consoleWidgetOffsets,
    setConsoleWidgetOffset,

    consoleWidgetSizes,
    setConsoleWidgetSize,

    outputWidgetOffsets,
    setOutputWidgetOffset,

    outputWidgetSizes,
    setOutputWidgetSize,

    consoleViewportView,
    setConsoleViewportView,

    outputViewportView,
    setOutputViewportView,
  } =
    useRuntime();


  return (
    <div className="app">
      <div className="app-pages">
        <Routes>
          <Route
            path="/console"
            element={
              <Console
                messages={
                  messages
                }
                setMessages={
                  setMessages
                }
                setResponse={
                  setResponse
                }

                systemStatus={
                  systemStatus
                }
                setSystemStatus={
                  setSystemStatus
                }

                reportError={
                  reportError
                }

                requestSettings={
                  requestSettings
                }
                setRequestSettings={
                  setRequestSettings
                }

                consoleWidgetOffsets={
                  consoleWidgetOffsets
                }
                setConsoleWidgetOffset={
                  setConsoleWidgetOffset
                }

                consoleWidgetSizes={
                  consoleWidgetSizes
                }
                setConsoleWidgetSize={
                  setConsoleWidgetSize
                }

                viewportView={
                  consoleViewportView
                }
                setViewportView={
                  setConsoleViewportView
                }
              />
            }
          />


          <Route
            path="/output"
            element={
              <Output
                outputFiles={
                  outputFiles
                }

                fileTypes={
                  outputFileTypes
                }

                widgetOffsets={
                  outputWidgetOffsets
                }
                setWidgetOffset={
                  setOutputWidgetOffset
                }

                widgetSizes={
                  outputWidgetSizes
                }
                setWidgetSize={
                  setOutputWidgetSize
                }

                viewportView={
                  outputViewportView
                }
                setViewportView={
                  setOutputViewportView
                }
              />
            }
          />


          <Route
            path="/models"
            element={
              <Models />
            }
          />


          <Route
            path="/resources"
            element={
              <Resources />
            }
          />


          <Route
            path="/memory"
            element={
              <Memory />
            }
          />


          <Route
            path="/analytics"
            element={
              <Analytics />
            }
          />


          <Route
            path="/"
            element={
              <Navigate
                to="/console"
                replace
              />
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/console"
                replace
              />
            }
          />
        </Routes>
      </div>


      <div className="app-navigation">
        <NavigationTabs />
      </div>
    </div>
  );
}


export default App;