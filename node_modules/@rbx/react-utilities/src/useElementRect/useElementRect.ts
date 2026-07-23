import { useState, useCallback, RefCallback } from 'react';

/**
 * Access the bounding box of an element
 *
 * @returns a DOMRect to be utilized and a callback ref to attach to a node
 */
const useElementRect = (): [DOMRect | null, RefCallback<HTMLElement>] => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useCallback((node: HTMLElement) => {
    if (node !== null) {
      setRect(node.getBoundingClientRect());
    }
  }, []);
  return [rect, ref];
};

export default useElementRect;
