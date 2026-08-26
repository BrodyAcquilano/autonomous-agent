import ReactMarkdown from "react-markdown";

import "./MarkdownRenderer.css";


function getMarkdownContent(
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


function MarkdownRenderer({
  file,
}) {
  const content =
    getMarkdownContent(
      file,
    );


  if (
    content ===
    null
  ) {
    return (
      <div className="markdown-renderer-missing">
        <span>
          MARKDOWN CONTENT NOT LOADED
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
    <article
  className="markdown-renderer"
  data-window-selectable="true"
>
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </article>
  );
}


export default MarkdownRenderer;