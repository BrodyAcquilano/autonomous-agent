import apiClient from "../axios";


const apisApi = {
  async getAll(
    params,
  ) {
    const response =
      await apiClient.get(
        "/apis",
        {
          params,
        },
      );


    return response.data.apis;
  },


  async get(
    id,
  ) {
    const response =
      await apiClient.get(
        `/apis/${id}`,
      );


    return response.data.api;
  },
};


export default apisApi;
