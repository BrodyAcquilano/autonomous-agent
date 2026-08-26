import "./CodeRenderer.css";


function getCodeContent(
  file,
) {
  if (
    typeof file?.content ===
    "string"
  ) {
    return file.content;
  }


  if (
    typeof file?.text ===
    "string"
  ) {
    return file.text;
  }


  return null;
}


function getLanguage(
  fileName,
) {
  if (
    typeof fileName !==
    "string"
  ) {
    return "";
  }


  const extension =
    fileName
      .split(
        ".",
      )
      .pop()
      ?.toLowerCase();


  return (
    extension ||
    ""
  );
}


function CodeRenderer({
  file,
}) {
  const content =
    getCodeContent(
      file,
    );


  const language =
    getLanguage(
      file?.fileName,
    );


  if (
    content ===
    null
  ) {
    return (
      <div className="code-renderer-missing">
        <span>
          CODE CONTENT NOT LOADED
        </span>

        {file?.fileName && (
          <code>
            {file.fileName}
          </code>
        )}
      </div>
    );
  }


  return (
    <div className="code-renderer">
      <div className="code-renderer-language">
        {language ||
          "CODE"}
      </div>

      <pre
  data-window-selectable="true"
>
        <code>
          {content}
        </code>
      </pre>
    </div>
  );
}


export default CodeRenderer;