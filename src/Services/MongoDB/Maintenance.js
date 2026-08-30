import apiClient from "../axios";


const maintenanceApi = {
  async getTickets() {
    const response =
      await apiClient.get(
        "/maintenance/tickets",
      );


    return response.data.tickets;
  },


  async updateTicketStatus(
    ticketId,
    status,
  ) {
    const response =
      await apiClient.patch(
        `/maintenance/tickets/${ticketId}`,
        {
          status,
        },
      );


    return response.data.ticket;
  },


  async ignoreTicket(
    ticketId,
  ) {
    const response =
      await apiClient.delete(
        `/maintenance/tickets/${ticketId}`,
      );


    return response.data;
  },


  async getLogsForAgent(
    agentName,
  ) {
    const response =
      await apiClient.get(
        `/maintenance/logs/${agentName}`,
      );


    return response.data.logs;
  },


  async deleteLogEntry(
    agentName,
    logId,
  ) {
    const response =
      await apiClient.delete(
        `/maintenance/logs/${agentName}/${logId}`,
      );


    return response.data;
  },
};


export default maintenanceApi;
