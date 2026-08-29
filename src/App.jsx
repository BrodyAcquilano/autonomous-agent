import {
  useEffect,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import useRuntime from "./Runtime/Runtime";

import apisApi from "./Api/Apis/apis";
import modelsApi from "./Api/Models/models";

import NavigationTabs from "./Components/NavigationTabs/NavigationTabs";

import Analytics from "./Pages/Analytics/Analytics";
import Console from "./Pages/Console/Console";
import Directory from "./Pages/Directory/Directory";
import Maintenance from "./Pages/Maintenance/Maintenance";
import Models from "./Pages/Models/Models";
import Output from "./Pages/Output/Output";

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

    models,
    setModels,

    apis,
    setApis,

    modelsLoading,
    setModelsLoading,

    modelsError,
    setModelsError,

    selectedModelId,
    setSelectedModelId,

    modelModalStack,
    setModelModalStack,

    toolsCatalog,
    capabilitiesCatalog,

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


  /*
   * Models/APIs are Execution Brain
   * catalog data — loaded once here so
   * the Models page (and its info modal
   * state, also owned by Runtime) survives
   * navigating away and back.
   */
  useEffect(
    () => {
      let mounted =
        true;


      const loadModelsAndApis =
        async () => {
          try {
            const [
              loadedModels,
              loadedApis,
            ] =
              await Promise.all([
                modelsApi.getAll(),
                apisApi.getAll(),
              ]);


            if (
              mounted
            ) {
              setModels(
                loadedModels,
              );

              setApis(
                loadedApis,
              );

              setModelsError(
                null,
              );
            }
          } catch (
            loadError
          ) {
            console.error(
              "Failed to load model documentation:",
              loadError,
            );


            if (
              mounted
            ) {
              setModelsError(
                loadError
                  .response
                  ?.data
                  ?.message ||
                loadError.message ||
                "Failed to load model documentation.",
              );
            }
          } finally {
            if (
              mounted
            ) {
              setModelsLoading(
                false,
              );
            }
          }
        };


      loadModelsAndApis();


      return () => {
        mounted =
          false;
      };
    },
    [
      setModels,
      setApis,
      setModelsError,
      setModelsLoading,
    ],
  );


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
              <Models
                models={
                  models
                }
                apis={
                  apis
                }
                modelsLoading={
                  modelsLoading
                }
                modelsError={
                  modelsError
                }
                selectedModelId={
                  selectedModelId
                }
                setSelectedModelId={
                  setSelectedModelId
                }
                modelModalStack={
                  modelModalStack
                }
                setModelModalStack={
                  setModelModalStack
                }
                toolsCatalog={
                  toolsCatalog
                }
                capabilitiesCatalog={
                  capabilitiesCatalog
                }
              />
            }
          />


          <Route
            path="/directory"
            element={
              <Directory />
            }
          />


          <Route
            path="/maintenance"
            element={
              <Maintenance />
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