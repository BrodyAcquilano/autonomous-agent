import "./TextRenderer.css";


function getTextContent(
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


function TextRenderer({
  file,
}) {
  const content =
    getTextContent(
      file,
    );


  if (
    content ===
    null
  ) {
    return (
      <div className="text-renderer-missing"  data-window-selectable="true">
        <span>
          TEXT CONTENT NOT LOADED
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
    <div className="text-renderer"  data-window-selectable="true">
   <pre
>
  {content}
</pre>
    </div>
  );
}


export default TextRenderer;