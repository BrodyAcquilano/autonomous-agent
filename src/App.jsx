import {
  useEffect,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import useRuntime from "./Runtime/Runtime";

import agentsApi from "./Services/MongoDB/Agents";
import apisApi from "./Services/MongoDB/Apis";
import directoryApi from "./Services/MongoDB/Directory";
import modelsApi from "./Services/MongoDB/Models";

import NavigationTabs from "./Components/NavigationTabs/NavigationTabs";

import Agents from "./Pages/Agents/Agents";
import Analytics from "./Pages/Analytics/Analytics";
import Capabilities from "./Pages/Capabilities/Capabilities";
import Console from "./Pages/Console/Console";
import Directory from "./Pages/Directory/Directory";
import Maintenance from "./Pages/Maintenance/Maintenance";
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

    agents,
    setAgents,

    agentsLoading,
    setAgentsLoading,

    agentsError,
    setAgentsError,

    selectedAgentId,
    setSelectedAgentId,

    directory,
    setDirectory,

    directoryLoading,
    setDirectoryLoading,

    directoryError,
    setDirectoryError,

    selectedDirectoryAgentId,
    setSelectedDirectoryAgentId,

    directoryModalStack,
    setDirectoryModalStack,

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
   * Models/APIs are Capabilities Brain
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


  /*
   * The Agents "Team" page has nothing to do
   * with the Capabilities Brain funnel above —
   * agent profile documents are a flat vector,
   * not linked to models/apis/tools/capabilities
   * at all — so this is its own effect with its
   * own loading/error state, loaded once here
   * for the same reason: survive navigating away
   * from /agents and back.
   */
  useEffect(
    () => {
      let mounted =
        true;


      const loadAgents =
        async () => {
          try {
            const loadedAgents =
              await agentsApi.getAll();


            if (
              mounted
            ) {
              setAgents(
                loadedAgents,
              );

              setAgentsError(
                null,
              );
            }
          } catch (
            loadError
          ) {
            console.error(
              "Failed to load agent profiles:",
              loadError,
            );


            if (
              mounted
            ) {
              setAgentsError(
                loadError
                  .response
                  ?.data
                  ?.message ||
                loadError.message ||
                "Failed to load agent profiles.",
              );
            }
          } finally {
            if (
              mounted
            ) {
              setAgentsLoading(
                false,
              );
            }
          }
        };


      loadAgents();


      return () => {
        mounted =
          false;
      };
    },
    [
      setAgents,
      setAgentsError,
      setAgentsLoading,
    ],
  );


  /*
   * The Directory ("who may call whom") is its
   * own structural tensor, unrelated to both the
   * Capabilities Brain and the Agents roster —
   * its own effect, own loading/error state,
   * loaded once here so it survives navigating
   * away from /directory and back.
   */
  useEffect(
    () => {
      let mounted =
        true;


      const loadDirectory =
        async () => {
          try {
            const loadedDirectory =
              await directoryApi.getAll();


            if (
              mounted
            ) {
              setDirectory(
                loadedDirectory,
              );

              setDirectoryError(
                null,
              );
            }
          } catch (
            loadError
          ) {
            console.error(
              "Failed to load directory:",
              loadError,
            );


            if (
              mounted
            ) {
              setDirectoryError(
                loadError
                  .response
                  ?.data
                  ?.message ||
                loadError.message ||
                "Failed to load directory.",
              );
            }
          } finally {
            if (
              mounted
            ) {
              setDirectoryLoading(
                false,
              );
            }
          }
        };


      loadDirectory();


      return () => {
        mounted =
          false;
      };
    },
    [
      setDirectory,
      setDirectoryError,
      setDirectoryLoading,
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
            path="/agents"
            element={
              <Agents
                agents={
                  agents
                }
                agentsLoading={
                  agentsLoading
                }
                agentsError={
                  agentsError
                }
                selectedAgentId={
                  selectedAgentId
                }
                setSelectedAgentId={
                  setSelectedAgentId
                }
              />
            }
          />


          <Route
            path="/directory"
            element={
              <Directory
                directory={
                  directory
                }
                directoryLoading={
                  directoryLoading
                }
                directoryError={
                  directoryError
                }
                selectedAgentId={
                  selectedDirectoryAgentId
                }
                setSelectedAgentId={
                  setSelectedDirectoryAgentId
                }
                modalStack={
                  directoryModalStack
                }
                setModalStack={
                  setDirectoryModalStack
                }
              />
            }
          />


          <Route
            path="/capabilities"
            element={
              <Capabilities
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