import "./CommunicationArray.css";


const LEFT_DASHES = [
  0,
  1,
  2,
  3,
  4,
];


const RIGHT_DASHES = [
  0,
  1,
  2,
  3,
  4,
];


const CENTER_DASHES = [
  0,
  1,
  2,
  3,
  4,
  5,
];


const SATELLITE_ART =
  String.raw`
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
                    .'       '.
                   /           \
                  /             \
                 /_______________\
                     |       |
                     |   x   |
                     |_______|

                COMMUNICATION ARRAY
`;


function Beam({
  className,
  dashes,
}) {
  return (
    <div
      className={`signal-beam ${className}`}
      aria-hidden="true"
    >
      {dashes.map(
        (index) => (
          <span
            key={index}
            className="signal-dash"
            style={{
              "--dash-index":
                index,
            }}
          />
        ),
      )}
    </div>
  );
}


function CommunicationArray() {
  return (
    <div className="communication-array">
      <div className="communication-array-glow" />

      <div
        className="signal-waves"
        aria-hidden="true"
      >
        <div className="signal-wave signal-wave-outer">
          )))                 (((
        </div>

        <div className="signal-wave signal-wave-middle">
          )))           (((
        </div>

        <div className="signal-wave signal-wave-inner">
          )))     (((
        </div>
      </div>

      <Beam
        className="signal-beam-left"
        dashes={
          LEFT_DASHES
        }
      />

      <Beam
        className="signal-beam-center"
        dashes={
          CENTER_DASHES
        }
      />

      <Beam
        className="signal-beam-right"
        dashes={
          RIGHT_DASHES
        }
      />

      <pre
        className="communication-array-art"
        aria-label="Satellite communication array"
      >
        {SATELLITE_ART}
      </pre>
    </div>
  );
}


export default CommunicationArray;