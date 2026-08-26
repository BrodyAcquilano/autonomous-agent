import apiClient from "../axios";


const openAIResponsesApi = {
  async request({
    model,
    input,
    instructions,
    maxOutputTokens,
  }) {
    const response =
      await apiClient.post(
        "/azure/openai-responses/request",
        {
          model,
          input,
          instructions,
          maxOutputTokens,
        },
      );


    return response.data;
  },
};


export default openAIResponsesApi;