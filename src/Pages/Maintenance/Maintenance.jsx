import {
  useMemo,
  useState,
} from "react";

import requestServiceApi from "../../Services/InternalOperations/RequestService";
import requestMaintenanceApi from "../../Services/InternalOperations/RequestMaintenance";
import maintenanceApi from "../../Services/MongoDB/Maintenance";

import FilterPanel from "./Components/FilterPanel/FilterPanel";
import EntryList from "./Components/EntryList/EntryList";
import TicketModal from "./Components/TicketModal/TicketModal";
import MaintenanceLogModal from "./Components/MaintenanceLogModal/MaintenanceLogModal";
import StatusIndicator from "./Components/StatusIndicator/StatusIndicator";

import "./Maintenance.css";


const ALL_AGENTS_FILTER =
  "all";

const ALL_TYPES_FILTER =
  "all";

const ALL_STATUSES_FILTER =
  "all";


/*
 * Two views over the same maintenance data:
 * "tickets" (the active queue — a ticket can be
 * reviewed, ignored, or used to restart the run
 * it came from) and "logs" (each agent's own
 * permanent, view-only history, filtered to one
 * agent at a time). Filters/view-mode/selection
 * are page-local — only the underlying fetched
 * data (tickets/logs) lives in Runtime, via
 * App.jsx.
 */
function Maintenance({
  agents,

  tickets,
  setTickets,
  ticketsLoading,
  ticketsError,

  logs,
  logsLoading,
  logsError,
  reloadLogs,
  reloadTickets,

  systemStatus,
  setSystemStatus,
  setResponse,
  reportError,
}) {
  const [
    viewMode,
    setViewMode,
  ] =
    useState(
      "tickets",
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState(
      ALL_TYPES_FILTER,
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      ALL_STATUSES_FILTER,
    );

  const [
    loggedByFilter,
    setLoggedByFilter,
  ] =
    useState(
      ALL_AGENTS_FILTER,
    );

  const [
    logsAgentFilter,
    setLogsAgentFilter,
  ] =
    useState(
      ALL_AGENTS_FILTER,
    );

  const [
    maintenanceFocusText,
    setMaintenanceFocusText,
  ] =
    useState(
      "",
    );

  const [
    maintenanceRequestPending,
    setMaintenanceRequestPending,
  ] =
    useState(
      false,
    );

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] =
    useState(
      null,
    );

  const [
    selectedLogId,
    setSelectedLogId,
  ] =
    useState(
      null,
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


  const filteredTickets =
    useMemo(
      () =>
        tickets.filter(
          (
            ticket,
          ) =>
            (
              typeFilter ===
              ALL_TYPES_FILTER ||
              ticket.type ===
                typeFilter
            ) &&
            (
              statusFilter ===
              ALL_STATUSES_FILTER ||
              ticket.status ===
                statusFilter
            ) &&
            (
              loggedByFilter ===
              ALL_AGENTS_FILTER ||
              ticket.loggedBy ===
                loggedByFilter
            ),
        ),
      [
        tickets,
        typeFilter,
        statusFilter,
        loggedByFilter,
      ],
    );


  const filteredLogs =
    useMemo(
      () =>
        logs.filter(
          (
            log,
          ) =>
            logsAgentFilter ===
              ALL_AGENTS_FILTER ||
            log.agentName ===
              logsAgentFilter,
        ),
      [
        logs,
        logsAgentFilter,
      ],
    );


  const selectedTicket =
    selectedTicketId
      ? tickets.find(
          (
            ticket,
          ) =>
            ticket._id ===
            selectedTicketId,
        ) ||
        null
      : null;


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


  async function handleMarkReviewed(
    ticket,
  ) {
    setActionPending(
      true,
    );

    try {
      const updatedTicket =
        await maintenanceApi.updateTicketStatus(
          ticket._id,
          "reviewed",
        );


      setTickets(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item._id ===
              updatedTicket._id
                ? updatedTicket
                : item,
          ),
      );

      setSelectedTicketId(
        null,
      );

      setStatusMessage(
        {
          tone:
            "info",

          text:
            "Ticket marked reviewed.",
        },
      );
    } catch (
      error
    ) {
      setStatusMessage(
        {
          tone:
            "error",

          text:
            error.response
              ?.data
              ?.message ||
            error.message ||
            "Failed to update the ticket.",
        },
      );
    } finally {
      setActionPending(
        false,
      );
    }
  }


  async function handleIgnore(
    ticket,
  ) {
    setActionPending(
      true,
    );

    try {
      await maintenanceApi.ignoreTicket(
        ticket._id,
      );


      setTickets(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item._id !==
              ticket._id,
          ),
      );

      setSelectedTicketId(
        null,
      );

      setStatusMessage(
        {
          tone:
            "info",

          text:
            "Ticket ignored and removed from the active queue.",
        },
      );
    } catch (
      error
    ) {
      setStatusMessage(
        {
          tone:
            "error",

          text:
            error.response
              ?.data
              ?.message ||
            error.message ||
            "Failed to ignore the ticket.",
        },
      );
    } finally {
      setActionPending(
        false,
      );
    }
  }


  /*
   * The server always removes this ticket from
   * the active queue as soon as it consumes it —
   * a restart is now a literal, full run from
   * Stage 1 (not a resume-in-place), using the
   * ticket's saved task/settings plus
   * Maintenance's own recommendation as extra
   * context — so the frontend drops it from local
   * state and closes the modal immediately, the
   * moment the request-service call resolves at
   * all, rather than waiting to see which way it
   * went. From there this mirrors exactly what
   * CommandShell.jsx does for a normal request:
   * setResponse() on success feeds the same
   * Console/Output pipeline (which itself carries
   * systemStatus through busy -> ready), and
   * reportError() on a blocked/failed result
   * carries systemStatus through busy -> error
   * and posts the message to the Console message
   * panel. A failed restart does NOT immediately
   * produce a new ticket anymore — it produces a
   * new incident log for the Maintenance agent to
   * triage later, which is why this reloads logs
   * (not tickets) afterward.
   */
  async function handleRestart(
    ticket,
  ) {
    setActionPending(
      true,
    );

    setSystemStatus(
      "busy",
    );

    setTickets(
      (
        current,
      ) =>
        current.filter(
          (
            item,
          ) =>
            item._id !==
            ticket._id,
        ),
    );

    setSelectedTicketId(
      null,
    );

    try {
      const result =
        await requestServiceApi.request(
          undefined,
          undefined,
          [],
          ticket._id,
        );


      if (
        result.status ===
        "blocked"
      ) {
        const newLog =
          result.log;


        reportError(
          `${newLog
            ?.type
            ?.toUpperCase() ||
            "MAINTENANCE"} LOG: ${
            newLog?.message ||
            "The Router could not complete this task."
          }\n${
            newLog?.details ||
            ""
          }`.trim(),
        );


        setStatusMessage(
          {
            tone:
              "error",

            text:
              "Restart failed again — a new incident was logged for Maintenance to review.",
          },
        );
      } else {
        setResponse(
          result.response,
        );


        setStatusMessage(
          {
            tone:
              "success",

            text:
              "Restart succeeded — the run completed.",
          },
        );
      }


      await reloadLogs();
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
        "Failed to restart the process.";


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


  async function handleDeleteLog(
    log,
  ) {
    setActionPending(
      true,
    );

    try {
      const result =
        await maintenanceApi.deleteLogEntry(
          log.agentName,
          log._id,
        );


      const cascadedTicketId =
        result
          ?.cascade
          ?.ticketId ||
        null;


      if (
        cascadedTicketId
      ) {
        setTickets(
          (
            current,
          ) =>
            current.filter(
              (
                ticket,
              ) =>
                ticket._id !==
                cascadedTicketId,
            ),
        );
      }

      await reloadLogs();

      setSelectedLogId(
        null,
      );

      setStatusMessage(
        {
          tone:
            "info",

          text:
            cascadedTicketId
              ? "Log entry deleted, along with the ticket filed from it."
              : "Log entry deleted.",
        },
      );
    } catch (
      error
    ) {
      setStatusMessage(
        {
          tone:
            "error",

          text:
            error.response
              ?.data
              ?.message ||
            error.message ||
            "Failed to delete the log entry.",
        },
      );
    } finally {
      setActionPending(
        false,
      );
    }
  }


  /*
   * A structurally separate request from a
   * normal Console task — this asks the
   * Maintenance agent to go investigate
   * something (or, with empty text, to sweep
   * whatever incidents are currently queued)
   * rather than asking the company to execute a
   * task. systemStatus is shared with the rest
   * of the app the same way a Console request or
   * a ticket restart uses it, since a sweep can
   * write new tickets/logs while it runs.
   */
  async function handleSubmitMaintenanceRequest() {
    setMaintenanceRequestPending(
      true,
    );

    setSystemStatus(
      "busy",
    );

    try {
      const result =
        await requestMaintenanceApi.request(
          maintenanceFocusText.trim() ||
            undefined,
        );


      setMaintenanceFocusText(
        "",
      );

      setSystemStatus(
        "ready",
      );

      setStatusMessage(
        {
          tone:
            "success",

          text:
            `Maintenance sweep complete (${result.mode}) — ${result.ticketsFiled} ${
              result.ticketsFiled ===
              1
                ? "ticket"
                : "tickets"
            } filed, ${result.logsProcessed} ${
              result.logsProcessed ===
              1
                ? "log"
                : "logs"
            } reviewed.`,
        },
      );

      await Promise.all(
        [
          reloadTickets(),
          reloadLogs(),
        ],
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
        "Maintenance request failed.";


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
      setMaintenanceRequestPending(
        false,
      );
    }
  }


  const loading =
    viewMode ===
    "tickets"
      ? ticketsLoading
      : logsLoading;

  const loadError =
    viewMode ===
    "tickets"
      ? ticketsError
      : logsError;


  return (
    <main
      className="maintenance-page"
      role="region"
      aria-label="Maintenance"
    >
      <header className="maintenance-page-header">
        <div className="maintenance-page-header-text">
          <span className="maintenance-page-eyebrow">
            MAINTENANCE PORTAL
          </span>

          <h1>
            Maintenance
          </h1>

          <p>
            Review active tickets from the
            autonomous company's agents, or
            browse each agent's own
            permanent log history.
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
          className={`maintenance-status-banner ${statusMessage.tone}`}
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


      <div className="maintenance-workspace">
        <FilterPanel
          viewMode={
            viewMode
          }
          setViewMode={
            setViewMode
          }
          typeFilter={
            typeFilter
          }
          setTypeFilter={
            setTypeFilter
          }
          statusFilter={
            statusFilter
          }
          setStatusFilter={
            setStatusFilter
          }
          agents={
            agents
          }
          loggedByFilter={
            loggedByFilter
          }
          setLoggedByFilter={
            setLoggedByFilter
          }
          logsAgentFilter={
            logsAgentFilter
          }
          setLogsAgentFilter={
            setLogsAgentFilter
          }
          ticketCount={
            filteredTickets.length
          }
          logCount={
            filteredLogs.length
          }
          maintenanceFocusText={
            maintenanceFocusText
          }
          setMaintenanceFocusText={
            setMaintenanceFocusText
          }
          maintenanceRequestPending={
            maintenanceRequestPending
          }
          onSubmitMaintenanceRequest={
            handleSubmitMaintenanceRequest
          }
          systemStatus={
            systemStatus
          }
        />


        <EntryList
          mode={
            viewMode
          }
          loading={
            loading
          }
          error={
            loadError
          }
          items={
            viewMode ===
            "tickets"
              ? filteredTickets
              : filteredLogs
          }
          onSelect={(
            item,
          ) => {
            if (
              viewMode ===
              "tickets"
            ) {
              setSelectedTicketId(
                item._id,
              );
            } else {
              setSelectedLogId(
                item._id,
              );
            }
          }}
          disabled={
            viewMode ===
              "tickets" &&
            systemStatus ===
              "busy"
          }
        />
      </div>


      {selectedTicket && (
        <TicketModal
          ticket={
            selectedTicket
          }
          actionPending={
            actionPending
          }
          systemStatus={
            systemStatus
          }
          onClose={() => {
            setSelectedTicketId(
              null,
            );
          }}
          onMarkReviewed={() => {
            handleMarkReviewed(
              selectedTicket,
            );
          }}
          onIgnore={() => {
            handleIgnore(
              selectedTicket,
            );
          }}
          onRestart={() => {
            handleRestart(
              selectedTicket,
            );
          }}
        />
      )}


      {selectedLog && (
        <MaintenanceLogModal
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
            handleDeleteLog(
              selectedLog,
            );
          }}
        />
      )}
    </main>
  );
}


export default Maintenance;
