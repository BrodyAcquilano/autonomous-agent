import CommandShell from "../../Components/CommandShell/CommandShell";
import CommunicationArray from "../../Components/CommunicationArray/CommunicationArray";
import LightPanel from "../../Components/LightPanel/LightPanel";
import Nameplate from "../../Components/Nameplate/Nameplate";

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

      <LightPanel />

      <pre
        className="terminal-man-banner"
        aria-hidden="true"
      >
        {TERMINAL_MAN_BANNER}
      </pre>

      <section className="console-workspace">
        <CommunicationArray />
      </section>

      <div className="console-lower-interface">
        <Nameplate />

        <CommandShell />
      </div>
    </main>
  );
}


export default Console;