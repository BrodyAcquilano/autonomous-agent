import useDraggable from "../../../../Hooks/useDraggable";

import "./LightPanel.css";

function LightPanel({ boundsRef }) {
  const { dragRef, dragHandleProps, dragStyle } = useDraggable({
    boundsRef,
  });

  return (
    <div
      ref={dragRef}
      className="light-panel"
      style={dragStyle}
      {...dragHandleProps}
    >
      <span className="light-panel-light" />

      <span className="light-panel-label">SYSTEM READY</span>
    </div>
  );
}

export default LightPanel;
