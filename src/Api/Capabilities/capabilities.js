import apiClient from "../axios";


const capabilitiesApi = {
  async getAll(
    params,
  ) {
    const response =
      await apiClient.get(
        "/capabilities",
        {
          params,
        },
      );


    return response.data.capabilities;
  },


  async get(
    id,
  ) {
    const response =
      await apiClient.get(
        `/capabilities/${id}`,
      );


    return response.data.capability;
  },
};


export default capabilitiesApi;
