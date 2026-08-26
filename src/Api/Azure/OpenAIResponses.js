import apiClient from "../axios";


const openAIResponsesApi = {
  async request(
    request,
    attachments = [],
  ) {
    if (
      attachments.length ===
      0
    ) {
      const response =
        await apiClient.post(
          "/azure/openai-responses/request",
          request,
        );


      return response.data;
    }


    const formData =
      new FormData();


    formData.append(
      "request",
      JSON.stringify(
        request,
      ),
    );


    attachments.forEach(
      (
        file,
      ) => {
        formData.append(
          "attachments",
          file,
          file.name,
        );
      },
    );


    const response =
      await apiClient.post(
        "/azure/openai-responses/request",
        formData,
      );


    return response.data;
  },
};


export default openAIResponsesApi;