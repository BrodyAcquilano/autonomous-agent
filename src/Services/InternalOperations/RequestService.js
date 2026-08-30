import apiClient from "../axios";


const requestServiceApi = {
  async request(
    task,
    controlPanelSettings,
    attachments = [],
    ticketId,
  ) {
    const payload = {
      task,

      controlPanelSettings,

      ticketId,
    };


    if (
      attachments.length ===
      0
    ) {
      const response =
        await apiClient.post(
          "/request-service/request",
          payload,
        );


      return response.data;
    }


    const formData =
      new FormData();


    formData.append(
      "request",
      JSON.stringify(
        payload,
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
        "/request-service/request",
        formData,
      );


    return response.data;
  },
};


export default requestServiceApi;
