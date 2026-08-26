import apiClient from "../axios";


const openAIResponsesApi = {
  async request(
    request,
  ) {
    const response =
      await apiClient.post(
        "/azure/openai-responses/request",
        request,
      );


    return response.data;
  },
};


export default openAIResponsesApi;