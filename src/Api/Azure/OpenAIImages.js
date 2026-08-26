import apiClient from "../axios";


const openAIImagesApi = {
  async request({
    model,
    prompt,
    size,
    quality,
    outputFormat,
    background,
    outputCompression,
    numberOfImages,
  }) {
    const response =
      await apiClient.post(
        "/azure/openai-images/request",
        {
          model,
          prompt,
          size,
          quality,
          outputFormat,
          background,
          outputCompression,
          numberOfImages,
        },
      );


    return response.data;
  },
};


export default openAIImagesApi;