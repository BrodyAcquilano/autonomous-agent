import apiClient from "../axios";


const modelsApi = {
  async getAll() {
    const response =
      await apiClient.get(
        "/models",
      );


    return response.data.models;
  },


  async get(
    modelId,
  ) {
    const response =
      await apiClient.get(
        `/models/${modelId}`,
      );


    return response.data.model;
  },
};


export default modelsApi;