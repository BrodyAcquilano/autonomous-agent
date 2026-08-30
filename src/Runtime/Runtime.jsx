import {
  useCallback,
  useEffect,
  useState,
} from "react";

import capabilitiesApi from "../Services/MongoDB/Capabilities";
import toolsApi from "../Services/MongoDB/Tools";

import useResponseOutput from "../Hooks/useResponseOutput";
import useWidgetLayout from "../Hooks/useWidgetLayout";


/* --------------------------------
   RUNTIME
-------------------------------- */

function useRuntime() {
  const [
    requestSettings,
    setRequestSettings,
  ] =
    useState({
      reasoning: {
        effort:
          "medium",

        mode:
          "standard",
      },

      max_output_tokens:
        12000,

      text: {
        verbosity:
          "medium",
      },

      tools: {
        image_generation: {
          enabled:
            false,

          quality:
            "auto",

          size:
            "auto",
        },

        code_interpreter: {
          enabled:
            false,
        },

        web_search: {
          enabled:
            true,
        },
      },
    });


  /*
   * Capabilities Brain catalogs (models, apis,
   * tools, capabilities) are small and global,
   * so Runtime owns them here instead of the
   * Models page — that way navigating away
   * from /models and back doesn't lose the
   * loaded catalog, the selected model, or
   * where the info modal's branching tree was
   * left (App.jsx performs the models/apis
   * fetch; tools/capabilities fetch below).
   */
  const [
    models,
    setModels,
  ] =
    useState(
      [],
    );


  const [
    apis,
    setApis,
  ] =
    useState(
      [],
    );


  const [
    modelsLoading,
    setModelsLoading,
  ] =
    useState(
      true,
    );


  const [
    modelsError,
    setModelsError,
  ] =
    useState(
      null,
    );


  const [
    selectedModelId,
    setSelectedModelId,
  ] =
    useState(
      null,
    );


  const [
    modelModalStack,
    setModelModalStack,
  ] =
    useState(
      [],
    );


  const [
    toolsCatalog,
    setToolsCatalog,
  ] =
    useState(
      [],
    );


  /*
   * The Agents "Team" page is unrelated to the
   * Capabilities Brain funnel above — agent
   * profile documents are a flat vector with no
   * links to anything else, so this only ever
   * needs the plain list plus which one the
   * info modal currently has open (no branching
   * stack like modelModalStack).
   */
  const [
    agents,
    setAgents,
  ] =
    useState(
      [],
    );


  const [
    agentsLoading,
    setAgentsLoading,
  ] =
    useState(
      true,
    );


  const [
    agentsError,
    setAgentsError,
  ] =
    useState(
      null,
    );


  const [
    selectedAgentId,
    setSelectedAgentId,
  ] =
    useState(
      null,
    );


  /*
   * The Directory ("who may call whom") is a
   * three-layer structural tensor — Agent ->
   * Contact -> Request Types — distinct from
   * both the Capabilities Brain funnel above
   * and the flat Agents "Team" roster. The
   * server indexes the whole directory
   * collection by type once, so this is a
   * single object with three arrays rather than
   * three separate top-level catalogs.
   */
  const [
    directory,
    setDirectory,
  ] =
    useState(
      {
        agents:
          [],

        contacts:
          [],

        requestTypes:
          [],
      },
    );


  const [
    directoryLoading,
    setDirectoryLoading,
  ] =
    useState(
      true,
    );


  const [
    directoryError,
    setDirectoryError,
  ] =
    useState(
      null,
    );


  const [
    selectedDirectoryAgentId,
    setSelectedDirectoryAgentId,
  ] =
    useState(
      null,
    );


  const [
    directoryModalStack,
    setDirectoryModalStack,
  ] =
    useState(
      [],
    );


  const [
    capabilitiesCatalog,
    setCapabilitiesCatalog,
  ] =
    useState(
      [],
    );


  useEffect(
    () => {
      let mounted =
        true;


      const loadExecutionBrainCatalogs =
        async () => {
          try {
            const [
              tools,
              capabilities,
            ] =
              await Promise.all([
                toolsApi.getAll(),
                capabilitiesApi.getAll(),
              ]);


            if (
              mounted
            ) {
              setToolsCatalog(
                tools,
              );

              setCapabilitiesCatalog(
                capabilities,
              );
            }
          } catch (
            error
          ) {
            console.error(
              "Failed to load tools/capabilities catalogs:",
              error,
            );
          }
        };


      loadExecutionBrainCatalogs();


      return () => {
        mounted =
          false;
      };
    },
    [],
  );


  /*
   * Each page owns a different
   * viewport implementation.
   *
   * Runtime only remembers the
   * camera state.
   */
  const [
    consoleViewportView,
    setConsoleViewportView,
  ] =
    useState(
      null,
    );


  const [
    outputViewportView,
    setOutputViewportView,
  ] =
    useState(
      null,
    );


  const resetOutputViewport =
    useCallback(
      () => {
        setOutputViewportView(
          null,
        );
      },
      [],
    );


  /*
   * Draggable/resizable widget layout
   * (Console + Output) lives in its own
   * hook — see src/Hooks/useWidgetLayout.js.
   */
  const {
    syncOutputWidgetsForFiles,
    ...widgetLayout
  } =
    useWidgetLayout();


  /*
   * The Console -> Output execution
   * pipeline (messages, response, output
   * files, error reporting) lives in its
   * own hook — see
   * src/Hooks/useResponseOutput.js.
   */
  const responseOutput =
    useResponseOutput({
      syncOutputWidgets:
        syncOutputWidgetsForFiles,

      resetOutputViewport,
    });


  return {
    ...responseOutput,

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

    ...widgetLayout,

    consoleViewportView,
    setConsoleViewportView,

    outputViewportView,
    setOutputViewportView,
  };
}


export default useRuntime;
