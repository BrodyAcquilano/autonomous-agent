import apiClient from "../axios";


const agentsApi = {
  async getAll() {
    const response =
      await apiClient.get(
        "/agents",
      );


    return response.data.agents;
  },


  async get(
    agentId,
  ) {
    const response =
      await apiClient.get(
        `/agents/${agentId}`,
      );


    return response.data.agent;
  },
};


export default agentsApi;
