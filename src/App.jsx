import {
  useCallback,
  useEffect,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import useRuntime from "./Runtime/Runtime";

import agentsApi from "./Services/MongoDB/Agents";
import analyticsApi from "./Services/MongoDB/Analytics";
import apisApi from "./Services/MongoDB/Apis";
import directoryApi from "./Services/MongoDB/Directory";
import maintenanceApi from "./Services/MongoDB/Maintenance";
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

    maintenanceTickets,
    setMaintenanceTickets,

    maintenanceTicketsLoading,
    setMaintenanceTicketsLoading,

    maintenanceTicketsError,
    setMaintenanceTicketsError,

    maintenanceLogs,
    setMaintenanceLogs,

    maintenanceLogsLoading,
    setMaintenanceLogsLoading,

    maintenanceLogsError,
    setMaintenanceLogsError,

    analyticsLogs,
    setAnalyticsLogs,

    analyticsLogsLoading,
    setAnalyticsLogsLoading,

    analyticsLogsError,
    setAnalyticsLogsError,

    selectedAnalyticsLogId,
    setSelectedAnalyticsLogId,

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


  /*
   * Maintenance tickets/logs are wrapped in
   * useCallback (rather than being inline
   * effect bodies like the loaders above)
   * because the Maintenance page also needs to
   * re-run them on demand after a ticket/log
   * action (review, ignore, restart, delete) —
   * re-fetching from the server afterward is
   * simpler and more trustworthy than predicting
   * the new state locally.
   */
  const loadMaintenanceTickets =
    useCallback(
      async () => {
        try {
          const loadedTickets =
            await maintenanceApi.getTickets();


          setMaintenanceTickets(
            loadedTickets,
          );

          setMaintenanceTicketsError(
            null,
          );
        } catch (
          loadError
        ) {
          console.error(
            "Failed to load maintenance tickets:",
            loadError,
          );


          setMaintenanceTicketsError(
            loadError
              .response
              ?.data
              ?.message ||
            loadError.message ||
            "Failed to load maintenance tickets.",
          );
        } finally {
          setMaintenanceTicketsLoading(
            false,
          );
        }
      },
      [
        setMaintenanceTickets,
        setMaintenanceTicketsError,
        setMaintenanceTicketsLoading,
      ],
    );


  useEffect(
    () => {
      loadMaintenanceTickets();
    },
    [
      loadMaintenanceTickets,
    ],
  );


  /*
   * One maintenance log collection per agent
   * (named after the agent, e.g.
   * maintenance.router) — this loads every
   * agent's log in parallel and merges them into
   * one array, tagged per entry with which agent
   * it came from by the server. Waits for the
   * Agents roster to finish loading first, since
   * it drives which agent names to fetch; an
   * agent whose collection has never been
   * written to (e.g. worker, which never files
   * its own tickets) simply comes back empty
   * rather than erroring.
   */
  const loadMaintenanceLogs =
    useCallback(
      async () => {
        if (
          agentsLoading ||
          !agents.length
        ) {
          return;
        }


        try {
          const results =
            await Promise.allSettled(
              agents.map(
                (
                  agent,
                ) =>
                  maintenanceApi.getLogsForAgent(
                    agent.name,
                  ),
              ),
            );


          const merged =
            results
              .filter(
                (
                  result,
                ) =>
                  result.status ===
                  "fulfilled",
              )
              .flatMap(
                (
                  result,
                ) =>
                  result.value,
              );


          const failures =
            results.filter(
              (
                result,
              ) =>
                result.status ===
                "rejected",
            );


          if (
            failures.length
          ) {
            console.error(
              "Some agent maintenance logs failed to load:",
              failures,
            );
          }


          setMaintenanceLogs(
            merged,
          );

          setMaintenanceLogsError(
            failures.length &&
              !merged.length
              ? "Failed to load maintenance logs."
              : null,
          );
        } catch (
          loadError
        ) {
          console.error(
            "Failed to load maintenance logs:",
            loadError,
          );


          setMaintenanceLogsError(
            "Failed to load maintenance logs.",
          );
        } finally {
          setMaintenanceLogsLoading(
            false,
          );
        }
      },
      [
        agents,
        agentsLoading,
        setMaintenanceLogs,
        setMaintenanceLogsError,
        setMaintenanceLogsLoading,
      ],
    );


  useEffect(
    () => {
      loadMaintenanceLogs();
    },
    [
      loadMaintenanceLogs,
    ],
  );


  /*
   * Same pattern as maintenance logs, against the
   * analytics database instead — analytics.router
   * and analytics.worker have genuinely different
   * shapes (a full per-stage trace vs. one
   * execution record), so unlike Maintenance's
   * tickets/logs this has no shared "type" field
   * to filter or color-code by; the Analytics page
   * treats each log generically.
   */
  const loadAnalyticsLogs =
    useCallback(
      async () => {
        if (
          agentsLoading ||
          !agents.length
        ) {
          return;
        }


        try {
          const results =
            await Promise.allSettled(
              agents.map(
                (
                  agent,
                ) =>
                  analyticsApi.getLogsForAgent(
                    agent.name,
                  ),
              ),
            );


          const merged =
            results
              .filter(
                (
                  result,
                ) =>
                  result.status ===
                  "fulfilled",
              )
              .flatMap(
                (
                  result,
                ) =>
                  result.value,
              );


          const failures =
            results.filter(
              (
                result,
              ) =>
                result.status ===
                "rejected",
            );


          if (
            failures.length
          ) {
            console.error(
              "Some agent analytics logs failed to load:",
              failures,
            );
          }


          setAnalyticsLogs(
            merged,
          );

          setAnalyticsLogsError(
            failures.length &&
              !merged.length
              ? "Failed to load analytics logs."
              : null,
          );
        } catch (
          loadError
        ) {
          console.error(
            "Failed to load analytics logs:",
            loadError,
          );


          setAnalyticsLogsError(
            "Failed to load analytics logs.",
          );
        } finally {
          setAnalyticsLogsLoading(
            false,
          );
        }
      },
      [
        agents,
        agentsLoading,
        setAnalyticsLogs,
        setAnalyticsLogsError,
        setAnalyticsLogsLoading,
      ],
    );


  useEffect(
    () => {
      loadAnalyticsLogs();
    },
    [
      loadAnalyticsLogs,
    ],
  );


  /*
   * systemStatus is shared app-wide state, not
   * something only the Console page produces —
   * a normal Console request going wrong
   * (an OpenAI/Azure-level error, or the Router
   * cancelling and filing a ticket) and a
   * Maintenance restart going wrong both end by
   * setting it to "error" via reportError(). A
   * new maintenance ticket may exist in either
   * case, so this reacts to the status itself
   * rather than duplicating a reload call at
   * every place that can produce an error.
   */
  useEffect(
    () => {
      if (
        systemStatus ===
        "error"
      ) {
        loadMaintenanceTickets();
      }
    },
    [
      systemStatus,
      loadMaintenanceTickets,
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
              <Maintenance
                agents={
                  agents
                }
                tickets={
                  maintenanceTickets
                }
                setTickets={
                  setMaintenanceTickets
                }
                ticketsLoading={
                  maintenanceTicketsLoading
                }
                ticketsError={
                  maintenanceTicketsError
                }
                logs={
                  maintenanceLogs
                }
                logsLoading={
                  maintenanceLogsLoading
                }
                logsError={
                  maintenanceLogsError
                }
                reloadLogs={
                  loadMaintenanceLogs
                }
                systemStatus={
                  systemStatus
                }
                setSystemStatus={
                  setSystemStatus
                }
                setResponse={
                  setResponse
                }
                reportError={
                  reportError
                }
              />
            }
          />


          <Route
            path="/analytics"
            element={
              <Analytics
                agents={
                  agents
                }
                logs={
                  analyticsLogs
                }
                setLogs={
                  setAnalyticsLogs
                }
                logsLoading={
                  analyticsLogsLoading
                }
                logsError={
                  analyticsLogsError
                }
                selectedLogId={
                  selectedAnalyticsLogId
                }
                setSelectedLogId={
                  setSelectedAnalyticsLogId
                }
                setMaintenanceTickets={
                  setMaintenanceTickets
                }
                setMaintenanceLogs={
                  setMaintenanceLogs
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
              />
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