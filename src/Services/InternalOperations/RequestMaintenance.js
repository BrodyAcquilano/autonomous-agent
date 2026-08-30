import apiClient from "../axios";


const requestMaintenanceApi = {
  async request(focus) {
    const response = await apiClient.post("/request-maintenance/request", {
      focus,
    });

    return response.data;
  },
};


export default requestMaintenanceApi;
