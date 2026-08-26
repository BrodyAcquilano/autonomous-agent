import "./UnknownRenderer.css";


function UnknownRenderer({
  file,
}) {
  return (
    <div className="unknown-renderer">
      <span className="unknown-renderer-title">
        UNKNOWN FILE TYPE
      </span>


      {file?.fileName && (
        <code className="unknown-renderer-file-name">
          {file.fileName}
        </code>
      )}


      {file?.mimeType ? (
        <span className="unknown-renderer-type">
          {file.mimeType}
        </span>
      ) : (
        <span className="unknown-renderer-type">
          MIME TYPE NOT AVAILABLE
        </span>
      )}
    </div>
  );
}


export default UnknownRenderer;