import useDraggable from "../../Hooks/useDraggable";

import "./Nameplate.css";


function Nameplate({
  boundsRef,
}) {
  const {
    dragRef,
    dragHandleProps,
    dragStyle,
  } = useDraggable({
    boundsRef,
  });


  return (
    <section
      ref={
        dragRef
      }
      className="nameplate"
      style={
        dragStyle
      }
      {...dragHandleProps}
    >
      <div className="nameplate-title">
        TERMINAL MAN
      </div>

      <div className="nameplate-subtitle">
        AUTONOMOUS CONTROL SYSTEM
      </div>

      <div className="nameplate-description">
        Enter instructions,
        load a task file,
        or initiate an autonomous
        operation.
      </div>
    </section>
  );
}


export default Nameplate;