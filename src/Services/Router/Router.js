import apiClient from "../axios";


const routerApi = {
  async request(
    task,
    controlPanelSettings,
    attachments = [],
  ) {
    const payload = {
      task,

      controlPanelSettings,
    };


    if (
      attachments.length ===
      0
    ) {
      const response =
        await apiClient.post(
          "/router/request",
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
        "/router/request",
        formData,
      );


    return response.data;
  },
};


export default routerApi;
