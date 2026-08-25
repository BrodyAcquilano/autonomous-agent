import {
  useState,
} from "react";

import openAIResponsesApi from "../../Api/Azure/OpenAIResponses";

import "./CommandShell.css";


function CommandShell({
  setMessages,
}) {
  const [
    command,
    setCommand,
  ] = useState("");


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(
    false,
  );


  const handleSubmit =
    async (
      event,
    ) => {
      event.preventDefault();


      const input =
        command.trim();


      if (
        !input ||
        isSubmitting
      ) {
        return;
      }


      setMessages(
        (
          currentMessages,
        ) => [
          ...currentMessages,
          {
            id:
              crypto.randomUUID(),

            role: "user",

            label: "YOU",

            content:
              input,
          },
        ],
      );


      setCommand("");


      setIsSubmitting(
        true,
      );


      try {
        const response =
          await openAIResponsesApi.request({
            input,
          });


        setMessages(
          (
            currentMessages,
          ) => [
            ...currentMessages,
            {
              id:
                crypto.randomUUID(),

              role:
                "assistant",

              label:
                "TERMINAL MAN",

              content:
                response.output,
            },
          ],
        );
      } catch (
        error
      ) {
        setMessages(
          (
            currentMessages,
          ) => [
            ...currentMessages,
            {
              id:
                crypto.randomUUID(),

              role:
                "error",

              label:
                "SYSTEM",

              content:
                error
                  .response
                  ?.data
                  ?.message ||
                error.message ||
                "Request failed.",
            },
          ],
        );
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };


  return (
    <form
      className="command-shell"
      onSubmit={
        handleSubmit
      }
    >
      <div className="command-prefix">
        &gt;
      </div>

      <input
        className="command-input"
        type="text"
        value={
          command
        }
        placeholder={
          isSubmitting
            ? "TERMINAL MAN IS PROCESSING..."
            : "ENTER COMMAND OR TASK..."
        }
        onChange={(
          event,
        ) =>
          setCommand(
            event
              .target
              .value,
          )
        }
      />

      <button
        type="button"
        className="command-file-button"
        aria-label="Add input file"
      >
        +
      </button>

      <button
        type="submit"
        className="command-run-button"
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "WORKING"
          : "EXECUTE"}
      </button>
    </form>
  );
}


export default CommandShell;