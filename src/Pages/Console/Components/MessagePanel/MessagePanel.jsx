import { useEffect, useRef, useState } from "react";

import useDraggable from "../../../../Hooks/useDraggable";

import "./MessagePanel.css";

function MessagePanel({ messages, boundsRef }) {
  const messagesEndRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const { dragRef, dragHandleProps, dragStyle } = useDraggable({
    boundsRef,

    disabled: isExpanded,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <section
      ref={dragRef}
      className={`message-panel ${isExpanded ? "expanded" : ""}`}
      style={dragStyle}
    >
      <div className="message-panel-header" {...dragHandleProps}>
        <span className="message-panel-title">CONSOLE OUTPUT</span>

        <div className="message-panel-controls">
          <span className="message-panel-status">COMMUNICATION CHANNEL</span>

          <button
            type="button"
            className="message-panel-window-button"
            aria-label={
              isExpanded ? "Restore console window" : "Maximize console window"
            }
            title={isExpanded ? "Restore" : "Maximize"}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "❐" : "□"}
          </button>
        </div>
      </div>

      <div className="message-panel-screen">
        {messages.length === 0 ? (
          <div className="message-panel-empty">AWAITING INPUT...</div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-label">{message.label}</div>

                <div className="message-content">{message.content}</div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </section>
  );
}

export default MessagePanel;
