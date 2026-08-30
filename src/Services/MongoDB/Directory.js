import apiClient from "../axios";


const directoryApi = {
  async getAll() {
    const response =
      await apiClient.get(
        "/directory",
      );


    return response.data.directory;
  },
};


export default directoryApi;
