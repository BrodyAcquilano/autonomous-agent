import {
  useMemo,
  useState,
} from "react";

import requestServiceApi from "../../Services/InternalOperations/RequestService";
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
    logsAgentFilter,
    setLogsAgentFilter,
  ] =
    useState(
      ALL_AGENTS_FILTER,
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
            ),
        ),
      [
        tickets,
        typeFilter,
        statusFilter,
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
   * the active queue as soon as it consumes it
   * to resume the run — regardless of whether
   * that resumed run then succeeds or fails
   * again — so the frontend drops it from local
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
   * panel — the only addition here is reloading
   * the tickets list afterward when a new ticket
   * was filed, since that ticket doesn't exist
   * yet at the moment of the optimistic removal
   * above.
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
        const newTicket =
          result.ticket;


        reportError(
          `${newTicket
            ?.type
            ?.toUpperCase() ||
            "MAINTENANCE"} TICKET: ${
            newTicket?.message ||
            "The Router could not complete this task."
          }\n${
            newTicket?.details ||
            ""
          }`.trim(),
        );


        setStatusMessage(
          {
            tone:
              "error",

            text:
              "Restart failed again — a new ticket was filed.",
          },
        );

        /*
         * No manual reloadTickets() call here —
         * reportError() above sets systemStatus
         * to "error", and App.jsx already reacts
         * to that transition by reloading the
         * tickets list on its own, the same way
         * it would for a Console-triggered error.
         */
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
      await maintenanceApi.deleteLogEntry(
        log.agentName,
        log._id,
      );

      await reloadLogs();

      setSelectedLogId(
        null,
      );

      setStatusMessage(
        {
          tone:
            "info",

          text:
            "Log entry deleted.",
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
