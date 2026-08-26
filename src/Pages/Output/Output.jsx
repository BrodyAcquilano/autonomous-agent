import Viewport from "./Components/Viewport/Viewport";
import ViewportWindow from "./Components/ViewportWindow/ViewportWindow";

import "./Output.css";


function getWindowOffset(
  index,
  count,
) {
  const columns =
    Math.min(
      Math.max(
        count,
        1,
      ),
      3,
    );


  const column =
    index %
    columns;


  const row =
    Math.floor(
      index /
      columns,
    );


  const centerColumn =
    (
      columns -
      1
    ) /
    2;


  return {
    x:
      (
        column -
        centerColumn
      ) *
      400,

    y:
      row *
      490,
  };
}


function Output({
  outputFiles = [],
}) {
  const files =
    Array.isArray(
      outputFiles,
    )
      ? outputFiles
      : [];


  /*
   * Temporary empty window lets us
   * test the workspace before file
   * renderers are implemented.
   */
  const windows =
    files.length >
    0
      ? files
      : [
          {
            id:
              "__output-placeholder__",

            placeholder:
              true,
          },
        ];


  return (
    <main
      className="output-page"
      role="region"
      aria-label="Output"
    >
      <Viewport>
        {windows.map(
          (
            file,
            index,
          ) => {
            const initialOffset =
              getWindowOffset(
                index,
                windows.length,
              );


            return (
              <ViewportWindow
                key={
                  file.id ||
                  `${file.fileName || "output"}-${index}`
                }
                initialOffset={
                  initialOffset
                }
                zIndex={
                  20 +
                  index
                }
                ariaLabel={
                  file.placeholder
                    ? "Empty output window"
                    : `Output file ${index + 1}`
                }
              />
            );
          },
        )}
      </Viewport>
    </main>
  );
}


export default Output;