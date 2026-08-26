import {
  useMemo,
} from "react";

import "./PdfRenderer.css";


function getPdfSource(
  file,
) {
  if (
    file?.url
  ) {
    return file.url;
  }


  if (
    file?.blobUrl
  ) {
    return file.blobUrl;
  }


  if (
    file?.dataUrl
  ) {
    return file.dataUrl;
  }


  if (
    file?.base64
  ) {
    return `data:application/pdf;base64,${file.base64}`;
  }


  return null;
}


function PdfRenderer({
  file,
}) {
  const source =
    useMemo(
      () =>
        getPdfSource(
          file,
        ),
      [
        file,
      ],
    );


  if (
    !source
  ) {
    return (
      <div className="pdf-renderer-missing">
        <span>
          PDF CONTENT NOT LOADED
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
    <div className="pdf-renderer">
      <iframe
        src={
          source
        }
        title={
          file?.fileName ||
          "PDF output"
        }
      />
    </div>
  );
}


export default PdfRenderer;