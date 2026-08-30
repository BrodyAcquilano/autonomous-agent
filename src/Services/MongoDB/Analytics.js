import apiClient from "../axios";


const analyticsApi = {
  async getLogsForAgent(
    agentName,
  ) {
    const response =
      await apiClient.get(
        `/analytics/logs/${agentName}`,
      );


    return response.data.logs;
  },


  async deleteLogEntry(
    agentName,
    logId,
  ) {
    const response =
      await apiClient.delete(
        `/analytics/logs/${agentName}/${logId}`,
      );


    return response.data;
  },
};


export default analyticsApi;
