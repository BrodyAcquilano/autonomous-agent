import useDraggable from "../../../../Hooks/useDraggable";

import "./LightPanel.css";


const STATUS_LABELS = {
  ready:
    "SYSTEM READY",

  busy:
    "SYSTEM BUSY",

  error:
    "SYSTEM ERROR",
};


function LightPanel({
  systemStatus =
    "ready",

  boundsRef,

  scale = 1,

  offset,

  onOffsetChange,
}) {
  const {
    dragRef,
    dragHandleProps,
    dragStyle,
  } =
    useDraggable({
      boundsRef,

      scale,

      offset,

      onOffsetChange,
    });


  const normalizedStatus =
    Object.prototype
      .hasOwnProperty.call(
        STATUS_LABELS,
        systemStatus,
      )
      ? systemStatus
      : "ready";


  return (
    <div
      ref={
        dragRef
      }
      className={`light-panel light-panel-${normalizedStatus}`}
      style={
        dragStyle
      }
      {...dragHandleProps}
    >
      <span className="light-panel-light" />


      <span className="light-panel-label">
        {
          STATUS_LABELS[
            normalizedStatus
          ]
        }
      </span>
    </div>
  );
}


export default LightPanel;