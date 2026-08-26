import {
  useMemo,
} from "react";

import "./ImageRenderer.css";


function getImageSource(
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
    const mimeType =
      file.mimeType ||
      "image/png";


    return `data:${mimeType};base64,${file.base64}`;
  }


  return null;
}


function ImageRenderer({
  file,
  onAspectRatio,
}) {
  const source =
    useMemo(
      () =>
        getImageSource(
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
      <div className="image-renderer-missing">
        IMAGE DATA NOT AVAILABLE
      </div>
    );
  }


  return (
    <div className="image-renderer">
      <img
        src={
          source
        }
        alt={
          file?.fileName ||
          "Generated output"
        }
        draggable="false"
        onLoad={(
          event,
        ) => {
          const image =
            event.currentTarget;


          if (
            image.naturalWidth >
              0 &&
            image.naturalHeight >
              0
          ) {
            onAspectRatio?.(
              image.naturalWidth /
              image.naturalHeight,
            );
          }
        }}
      />
    </div>
  );
}


export default ImageRenderer;