import {
  useState,
} from "react";

import openAIResponsesApi from "../../../../Api/Azure/OpenAIResponses";

import "./CommandShell.css";


function CommandShell({
  model,
  requestSettings,
  setMessages,
}) {
  const [
    command,
    setCommand,
  ] =
    useState(
      "",
    );


  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
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

            role:
              "user",

            label:
              "YOU",

            content:
              input,
          },
        ],
      );


      setCommand(
        "",
      );


      setIsSubmitting(
        true,
      );


      /*
       * This is the actual Responses API
       * request assembled by the Console.
       *
       * The frontend intentionally supplies
       * only the parameters exposed by this
       * interface.
       */
      const request = {
        model,

        input,

        reasoning: {
          effort:
            requestSettings
              .reasoning
              .effort,

          mode:
            requestSettings
              .reasoning
              .mode,
        },

        max_output_tokens:
          requestSettings
            .max_output_tokens,

        text: {
          verbosity:
            requestSettings
              .text
              .verbosity,
        },
      };


      try {
        const response =
          await openAIResponsesApi.request(
            request,
          );


        const output =
          response.output_text ||
          "Request completed without text output.";


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
                "ASSISTANT",

              content:
                output,
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
            ? "PROCESSING..."
            : "ENTER COMMAND OR TASK..."
        }
        onChange={(
          event,
        ) => {
          setCommand(
            event.target.value,
          );
        }}
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