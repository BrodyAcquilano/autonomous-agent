import "./CommunicationArray.css";


const WAVE_PULSES = [
  0,
  1,
  2,
  3,
];


function CommunicationArray() {
  return (
    <div className="communication-array">
      <div className="communication-array-scene">
        <div className="communication-array-glow" />


        <div
          className="signal-waves"
          aria-hidden="true"
        >
          {WAVE_PULSES.map(
            (
              index,
            ) => (
              <div
                key={
                  index
                }
                className="signal-wave-pulse"
                style={{
                  "--wave-index":
                    index,
                }}
              >
                <span className="signal-wave-left">
                  )))
                </span>


                <span className="signal-wave-right">
                  (((
                </span>
              </div>
            ),
          )}
        </div>


        <pre
          className="communication-array-art"
          aria-label="Satellite communication array"
        >
          {String.raw`
                        [*]
                         |
         \               |               /
          \              |              /
           '.            |            .'
             '-.         |         .-'
                '--------|--------'
                         |
                         |
                      ___|___
                     |       | 
                     |       |     
                     |       | 
                  ___|_______|___ 
                 |               |
                 |               |
                 |_______________|

`}
        </pre>
      </div>
    </div>
  );
}


export default CommunicationArray;