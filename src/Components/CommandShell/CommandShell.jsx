import {
  useState,
} from "react";

import openAIResponsesApi from "../../Api/Azure/OpenAIResponses";

import "./CommandShell.css";


function CommandShell() {
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


      console.log(
        "You:",
        input,
      );


      setIsSubmitting(
        true,
      );


      try {
        const response =
          await openAIResponsesApi.request({
            input,
          });


        console.log(
          "Terminal Man:",
          response.output,
        );


        setCommand("");
      } catch (
        error
      ) {
        console.error(
          "Terminal Man request failed:",
          error,
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
        placeholder="ENTER COMMAND OR TASK..."
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
        EXECUTE
      </button>
    </form>
  );
}


export default CommandShell;