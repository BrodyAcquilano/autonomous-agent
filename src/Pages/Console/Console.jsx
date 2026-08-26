import {
  useRef,
  useState,
} from "react";

import CommandShell from "./Components/CommandShell/CommandShell";
import CommunicationArray from "./Components/CommunicationArray/CommunicationArray";
import LightPanel from "./Components/LightPanel/LightPanel";
import MessagePanel from "./Components/MessagePanel/MessagePanel";
import RequestControlPanel from "./Components/RequestControlPanel/RequestControlPanel";

import "./Console.css";


const ROUTER_MODEL_ID =
  "gpt-5.6-terra";


const TERMINAL_MAN_BANNER = String.raw`
////////////////////////////////////////////////////////////////////////////////

#####  #####  ####   #   #  #####  #   #   ###   #      #   #   ###   #   #
  #    #      #   #  ## ##    #    ##  #  #   #  #      ## ##  #   #  ##  #
  #    ####   ####   # # #    #    # # #  #####  #      # # #  #####  # # #
  #    #      #  #   #   #    #    #  ##  #   #  #      #   #  #   #  #  ##
  #    #####  #   #  #   #  #####  #   #  #   #  #####  #   #  #   #  #   #

////////////////////////////////////////////////////////////////////////////////
`;


const STAR_FIELD_ONE = String.raw`
       *                       .                       *
                .                         *
   .                                      .                    *
                           *
              *                                      .
                                                *
     .                *              .
`;


const STAR_FIELD_TWO = String.raw`
              .                              *
      *                                              .
                         .         *
                                                   *
   *                  .                                 .
                                 *
            .                           *
`;


function Console({
  messages,
  setMessages,
  setResponse,
}) {
const [
  requestSettings,
  setRequestSettings,
] =
  useState({
    reasoning: {
      effort:
        "medium",

      mode:
        "standard",
    },

    max_output_tokens:
      12000,

    text: {
      verbosity:
        "medium",
    },

    tools: {
      image_generation: {
        enabled:
          false,

        quality:
          "high",

        size:
          "1024x1024",
      },

      code_interpreter: {
        enabled:
          false,
      },
    },
  });


  const widgetBoundsRef =
    useRef(
      null,
    );


  return (
    <main className="console-page">
      <div
        className="retro-background"
        aria-hidden="true"
      >
        <div className="deep-space-glow" />


        <pre className="terminal-stars terminal-stars-one">
          {STAR_FIELD_ONE}
        </pre>


        <pre className="terminal-stars terminal-stars-two">
          {STAR_FIELD_TWO}
        </pre>


        <div className="scanlines" />


        <div className="screen-vignette" />
      </div>


      <pre
        className="terminal-man-banner"
        aria-hidden="true"
      >
        {TERMINAL_MAN_BANNER}
      </pre>


      <section className="console-workspace">
        <CommunicationArray />
      </section>


      <div
        ref={
          widgetBoundsRef
        }
        className="console-widget-layer"
      >
        <LightPanel
          boundsRef={
            widgetBoundsRef
          }
        />


        <RequestControlPanel
          model={
            ROUTER_MODEL_ID
          }
          requestSettings={
            requestSettings
          }
          setRequestSettings={
            setRequestSettings
          }
          boundsRef={
            widgetBoundsRef
          }
        />


        <MessagePanel
          messages={
            messages
          }
          boundsRef={
            widgetBoundsRef
          }
        />
      </div>


      <div className="console-lower-interface">
        <CommandShell
          model={
            ROUTER_MODEL_ID
          }
          requestSettings={
            requestSettings
          }
          setMessages={
            setMessages
          }
          setResponse={
            setResponse
          }
        />
      </div>
    </main>
  );
}


export default Console;