import {
  useMemo,
  useState,
} from "react";

import analyticsApi from "../../Services/MongoDB/Analytics";

import FilterPanel from "./Components/FilterPanel/FilterPanel";
import EntryList from "./Components/EntryList/EntryList";
import AnalyticsLogModal from "./Components/AnalyticsLogModal/AnalyticsLogModal";
import StatusIndicator from "./Components/StatusIndicator/StatusIndicator";

import "./Analytics.css";


const ALL_AGENTS_FILTER =
  "all";


/*
 * A read-only logs interface for now — see
 * docs/architecture/07-analytics.md for the
 * target shape (logs, widgets, and narrative
 * reports). Unlike the Maintenance page, this has
 * only one view (there is no "tickets" concept in
 * analytics), and unlike maintenance.router/
 * maintenance.analyst — which share an identical
 * ticket shape — analytics.router (a full
 * per-stage run trace) and analytics.worker (one
 * execution record) genuinely differ, so logs are
 * rendered generically rather than assuming a
 * shared set of fields.
 */
function Analytics({
  agents,

  logs,
  setLogs,
  logsLoading,
  logsError,

  selectedLogId,
  setSelectedLogId,

  setMaintenanceTickets,
  setMaintenanceLogs,

  systemStatus,
  setSystemStatus,
  reportError,
}) {
  const [
    agentFilter,
    setAgentFilter,
  ] =
    useState(
      ALL_AGENTS_FILTER,
    );

  const [
    actionPending,
    setActionPending,
  ] =
    useState(
      false,
    );

  const [
    statusMessage,
    setStatusMessage,
  ] =
    useState(
      null,
    );


  const filteredLogs =
    useMemo(
      () =>
        logs.filter(
          (
            log,
          ) =>
            agentFilter ===
              ALL_AGENTS_FILTER ||
            log.agentName ===
              agentFilter,
        ),
      [
        logs,
        agentFilter,
      ],
    );


  const selectedLog =
    selectedLogId
      ? logs.find(
          (
            log,
          ) =>
            log._id ===
            selectedLogId,
        ) ||
        null
      : null;


  /*
   * A log's own _id is the same id every
   * maintenance ticket/log stores as
   * `state.runId` — deleting it cascades on the
   * server (see deleteMaintenanceRecordsForRun),
   * which reports back exactly which maintenance
   * ticket/log ids it also removed, so the same
   * cascade is mirrored here in local state
   * instead of waiting on a full re-fetch of
   * pages that aren't even open right now.
   */
  async function handleDelete(
    log,
  ) {
    setActionPending(
      true,
    );

    setSystemStatus(
      "busy",
    );

    try {
      const result =
        await analyticsApi.deleteLogEntry(
          log.agentName,
          log._id,
        );


      setLogs(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item._id !==
              log._id,
          ),
      );


      const cascade =
        result.cascade ||
        {
          ticketIds:
            [],

          logIds:
            [],
        };


      if (
        cascade.ticketIds
          .length
      ) {
        setMaintenanceTickets(
          (
            current,
          ) =>
            current.filter(
              (
                ticket,
              ) =>
                !cascade.ticketIds.includes(
                  ticket._id,
                ),
            ),
        );
      }


      if (
        cascade.logIds
          .length
      ) {
        setMaintenanceLogs(
          (
            current,
          ) =>
            current.filter(
              (
                item,
              ) =>
                !cascade.logIds.includes(
                  item._id,
                ),
            ),
        );
      }


      setSelectedLogId(
        null,
      );

      setSystemStatus(
        "ready",
      );

      setStatusMessage(
        {
          tone:
            "info",

          text:
            cascade.ticketIds
              .length ||
            cascade.logIds
              .length
              ? "Log deleted, along with maintenance records that referenced this run."
              : "Log deleted.",
        },
      );
    } catch (
      error
    ) {
      const errorMessage =
        error.response
          ?.data
          ?.message ||
        error.response
          ?.data
          ?.error ||
        error.message ||
        "Failed to delete the log entry.";


      reportError(
        errorMessage,
      );

      setStatusMessage(
        {
          tone:
            "error",

          text:
            errorMessage,
        },
      );
    } finally {
      setActionPending(
        false,
      );
    }
  }


  return (
    <main
      className="analytics-page"
      role="region"
      aria-label="Analytics"
    >
      <header className="analytics-page-header">
        <div className="analytics-page-header-text">
          <span className="analytics-page-eyebrow">
            ANALYTICS
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Every agent's own process log —
            read-only for now. Widgets and
            narrative reports come later, once
            the Analyst is built up.
          </p>
        </div>


        <StatusIndicator
          systemStatus={
            systemStatus
          }
        />
      </header>


      {statusMessage && (
        <div
          className={`analytics-status-banner ${statusMessage.tone}`}
        >
          <span>
            {statusMessage.text}
          </span>

          <button
            type="button"
            onClick={() => {
              setStatusMessage(
                null,
              );
            }}
          >
            ×
          </button>
        </div>
      )}


      <div className="analytics-workspace">
        <FilterPanel
          agents={
            agents
          }
          agentFilter={
            agentFilter
          }
          setAgentFilter={
            setAgentFilter
          }
          logCount={
            filteredLogs.length
          }
        />


        <EntryList
          loading={
            logsLoading
          }
          error={
            logsError
          }
          items={
            filteredLogs
          }
          onSelect={(
            item,
          ) => {
            setSelectedLogId(
              item._id,
            );
          }}
        />
      </div>


      {selectedLog && (
        <AnalyticsLogModal
          log={
            selectedLog
          }
          actionPending={
            actionPending
          }
          onClose={() => {
            setSelectedLogId(
              null,
            );
          }}
          onDelete={() => {
            handleDelete(
              selectedLog,
            );
          }}
        />
      )}
    </main>
  );
}


export default Analytics;
