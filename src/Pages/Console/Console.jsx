import { useRef, useState } from "react";

import CommandShell from "./Components/CommandShell/CommandShell";
import CommunicationArray from "./Components/CommunicationArray/CommunicationArray";
import LightPanel from "./Components/LightPanel/LightPanel";
import MessagePanel from "./Components/MessagePanel/MessagePanel";
import Nameplate from "./Components/Nameplate/Nameplate";

import "./Console.css";

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

function Console() {
  const [messages, setMessages] = useState([]);

  const widgetBoundsRef = useRef(null);

  return (
    <main className="console-page">
      <div className="retro-background" aria-hidden="true">
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

      <pre className="terminal-man-banner" aria-hidden="true">
        {TERMINAL_MAN_BANNER}
      </pre>

      <section className="console-workspace">
        <CommunicationArray />
      </section>

      <div ref={widgetBoundsRef} className="console-widget-layer">
        <LightPanel boundsRef={widgetBoundsRef} />

        <Nameplate boundsRef={widgetBoundsRef} />

        <MessagePanel messages={messages} boundsRef={widgetBoundsRef} />
      </div>

      <div className="console-lower-interface">
        <CommandShell setMessages={setMessages} />
      </div>
    </main>
  );
}

export default Console;
