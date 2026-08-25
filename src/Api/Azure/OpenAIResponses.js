import apiClient from "../axios";


const openAIResponsesApi = {
  async request({
    input,
    instructions,
    maxOutputTokens,
  }) {
    const response =
      await apiClient.post(
        "/azure/openai-responses/request",
        {
          input,
          instructions,
          maxOutputTokens,
        },
      );


    return response.data;
  },
};


export default openAIResponsesApi;