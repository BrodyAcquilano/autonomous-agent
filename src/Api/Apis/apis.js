import apiClient from "../axios";


const apisApi = {
  async getAll() {
    const response =
      await apiClient.get(
        "/apis",
      );


    return response.data.apis;
  },


  async get(
    platform,
    apiId,
  ) {
    const response =
      await apiClient.get(
        `/apis/${encodeURIComponent(
          platform,
        )}/${encodeURIComponent(
          apiId,
        )}`,
      );


    return response.data.api;
  },
};


export default apisApi;