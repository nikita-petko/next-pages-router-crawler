import { ReactNode, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

/**
 * This hook allows you to render a react component to a raw HTML string.
 * While the rendering process is pending, it will return `null`.
 *
 * Since it creates a new react root that is never added into the document tree,
 * interactive components should not be used in the `renderFunction`.
 *
 * Since it calls react-dom's flushSync through a sequence of two callbacks, it is
 * fairly expensive, and is guaranteed to cause at least one additional render
 * of the calling component.
 *
 * NOTE(tyin@20250210): Originally from creator-hub/charts-generic/.../useReactRenderedRawHtml.ts -- PR #7434
 */
const useReactRenderedRawHtml = (renderFunction: () => ReactNode): null | string => {
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  useEffect(() => {
    let reactRoot: ReturnType<typeof createRoot> | null = null;
    let retrieveRawHtmlCallbackId: ReturnType<typeof setTimeout> | null = null;
    const renderAndFlushCallbackId = setTimeout(() => {
      const div = document.createElement('div');
      const root = createRoot(div);
      reactRoot = root;
      flushSync(() => {
        root.render(renderFunction());
      });
      retrieveRawHtmlCallbackId = setTimeout(() => {
        const { innerHTML } = div;
        setRawHtml(innerHTML);
      });
    });
    return () => {
      clearTimeout(renderAndFlushCallbackId);
      if (retrieveRawHtmlCallbackId) clearTimeout(retrieveRawHtmlCallbackId);

      // `div` is no longer held in scope after these function calls are cleared...
      // so we just need to tell react not to hold on to them
      reactRoot?.unmount();
    };
  }, [renderFunction]);
  return rawHtml;
};
export default useReactRenderedRawHtml;
