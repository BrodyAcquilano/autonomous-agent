import apiClient from "../axios";


const toolsApi = {
  async getAll(
    params,
  ) {
    const response =
      await apiClient.get(
        "/tools",
        {
          params,
        },
      );


    return response.data.tools;
  },


  async get(
    id,
  ) {
    const response =
      await apiClient.get(
        `/tools/${id}`,
      );


    return response.data.tool;
  },
};


export default toolsApi;
