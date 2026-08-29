import {
  useCallback,
  useState,
} from "react";


/* --------------------------------
   OUTPUT WINDOW LAYOUT HELPERS
-------------------------------- */

const OUTPUT_PLACEHOLDER_KEY =
  "__output-placeholder__";


function getOutputWidgetKey(
  file,
  index,
) {
  return (
    file?.id ||
    `${file?.fileName || "output"}-${index}`
  );
}


function createEmptyWidgetSize() {
  return {
    width:
      null,

    height:
      null,
  };
}


function createOutputWidgetOffsets(
  files,
  currentOffsets = {},
) {
  /*
   * Runtime remembers user-arranged
   * positions, but it no longer decides
   * the automatic grid geometry.
   *
   * A null value means:
   *
   * "This window has never been manually
   * arranged. Output may place it using
   * the current virtual-stage width."
   *
   * Once the user drags/resizes from a
   * north/west edge, setOutputWidgetOffset
   * replaces null with the real x/y value.
   */
  const nextOffsets = {
    [OUTPUT_PLACEHOLDER_KEY]:
      Object.prototype
        .hasOwnProperty.call(
          currentOffsets,
          OUTPUT_PLACEHOLDER_KEY,
        )
        ? currentOffsets[
            OUTPUT_PLACEHOLDER_KEY
          ]
        : null,
  };


  if (
    !Array.isArray(
      files,
    ) ||
    files.length ===
      0
  ) {
    return nextOffsets;
  }


  files.forEach(
    (
      file,
      index,
    ) => {
      const widgetKey =
        getOutputWidgetKey(
          file,
          index,
        );


      nextOffsets[
        widgetKey
      ] =
        Object.prototype
          .hasOwnProperty.call(
            currentOffsets,
            widgetKey,
          )
          ? currentOffsets[
              widgetKey
            ]
          : null;
    },
  );


  return nextOffsets;
}


function createOutputWidgetSizes(
  files,
  currentSizes = {},
) {
  const nextSizes = {
    [OUTPUT_PLACEHOLDER_KEY]:
      currentSizes[
        OUTPUT_PLACEHOLDER_KEY
      ] ||
      createEmptyWidgetSize(),
  };


  if (
    !Array.isArray(
      files,
    ) ||
    files.length ===
      0
  ) {
    return nextSizes;
  }


  files.forEach(
    (
      file,
      index,
    ) => {
      const widgetKey =
        getOutputWidgetKey(
          file,
          index,
        );


      nextSizes[
        widgetKey
      ] =
        currentSizes[
          widgetKey
        ] ||
        createEmptyWidgetSize();
    },
  );


  return nextSizes;
}


/* --------------------------------
   WIDGET LAYOUT HOOK
-------------------------------- */

/*
 * Owns draggable/resizable widget offsets
 * and sizes for both Console and Output
 * pages. useDraggable/useResizable (this
 * same Hooks folder) handle the pointer
 * mechanics of a single widget; this hook
 * handles persisting the resulting layout
 * across all of them.
 */
function useWidgetLayout() {
  /*
   * Console widget movement is stored
   * separately from Output movement.
   *
   * CSS defines the base positions.
   * These values are only offsets.
   */
  const [
    consoleWidgetOffsets,
    setConsoleWidgetOffsets,
  ] =
    useState({
      lightPanel: {
        x:
          0,

        y:
          0,
      },

      messagePanel: {
        x:
          0,

        y:
          0,
      },

      requestControlPanel: {
        x:
          0,

        y:
          0,
      },
    });


  /*
   * Dynamic Output windows are keyed
   * by their output file IDs.
   */
  const [
    outputWidgetOffsets,
    setOutputWidgetOffsets,
  ] =
    useState({
      /*
       * null means the placeholder has not
       * been manually arranged yet.
       *
       * Output will place it using the same
       * evenly-spaced stage layout as normal
       * output windows.
       */
      [OUTPUT_PLACEHOLDER_KEY]:
        null,
    });


  /*
   * Resizable Console widgets keep their
   * dimensions here just like their
   * offsets.
   *
   * LightPanel uses its persisted height
   * to derive its internal text/light scale.
   */
  const [
    consoleWidgetSizes,
    setConsoleWidgetSizes,
  ] =
    useState({
      lightPanel:
        createEmptyWidgetSize(),

      messagePanel:
        createEmptyWidgetSize(),

      requestControlPanel:
        createEmptyWidgetSize(),
    });


  /*
   * Dynamic Output window dimensions are
   * keyed by the same IDs as their offsets.
   */
  const [
    outputWidgetSizes,
    setOutputWidgetSizes,
  ] =
    useState({
      [OUTPUT_PLACEHOLDER_KEY]:
        createEmptyWidgetSize(),
    });


  const setConsoleWidgetOffset =
    useCallback(
      (
        widgetKey,
        nextOffset,
      ) => {
        if (
          !Number.isFinite(
            nextOffset?.x,
          ) ||
          !Number.isFinite(
            nextOffset?.y,
          )
        ) {
          return;
        }


        setConsoleWidgetOffsets(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                x:
                  nextOffset.x,

                y:
                  nextOffset.y,
              },
            };
          },
        );
      },
      [],
    );


  const setOutputWidgetOffset =
    useCallback(
      (
        widgetKey,
        nextOffset,
      ) => {
        if (
          !Number.isFinite(
            nextOffset?.x,
          ) ||
          !Number.isFinite(
            nextOffset?.y,
          )
        ) {
          return;
        }


        setOutputWidgetOffsets(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                x:
                  nextOffset.x,

                y:
                  nextOffset.y,
              },
            };
          },
        );
      },
      [],
    );


  const setConsoleWidgetSize =
    useCallback(
      (
        widgetKey,
        nextSize,
      ) => {
        if (
          !Number.isFinite(
            nextSize?.width,
          ) ||
          !Number.isFinite(
            nextSize?.height,
          )
        ) {
          return;
        }


        setConsoleWidgetSizes(
          (
            current,
          ) => ({
            /*
             * Do not require the key to
             * already exist.
             *
             * Vite Fast Refresh can preserve
             * an older Runtime state object
             * after a new resizable widget is
             * added to the initializer.
             *
             * Allowing this assignment to add
             * the key makes new widget sizes
             * persist immediately.
             */
            ...current,

            [widgetKey]: {
              width:
                nextSize.width,

              height:
                nextSize.height,
            },
          }),
        );
      },
      [],
    );


  const setOutputWidgetSize =
    useCallback(
      (
        widgetKey,
        nextSize,
      ) => {
        if (
          !Number.isFinite(
            nextSize?.width,
          ) ||
          !Number.isFinite(
            nextSize?.height,
          )
        ) {
          return;
        }


        setOutputWidgetSizes(
          (
            current,
          ) => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  current,
                  widgetKey,
                )
            ) {
              return current;
            }


            return {
              ...current,

              [widgetKey]: {
                width:
                  nextSize.width,

                height:
                  nextSize.height,
              },
            };
          },
        );
      },
      [],
    );


  /*
   * Called whenever the Output file list
   * changes, so every file gets an offset/
   * size entry (preserving any the user
   * already arranged) and removed files
   * drop theirs.
   */
  const syncOutputWidgetsForFiles =
    useCallback(
      (
        files,
      ) => {
        setOutputWidgetOffsets(
          (
            currentOffsets,
          ) =>
            createOutputWidgetOffsets(
              files,
              currentOffsets,
            ),
        );


        setOutputWidgetSizes(
          (
            currentSizes,
          ) =>
            createOutputWidgetSizes(
              files,
              currentSizes,
            ),
        );
      },
      [],
    );


  return {
    consoleWidgetOffsets,
    setConsoleWidgetOffset,

    consoleWidgetSizes,
    setConsoleWidgetSize,

    outputWidgetOffsets,
    setOutputWidgetOffset,

    outputWidgetSizes,
    setOutputWidgetSize,

    syncOutputWidgetsForFiles,
  };
}


export default useWidgetLayout;
