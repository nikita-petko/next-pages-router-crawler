import { useState, useEffect } from 'react';

export function createPolyfillGate(
  needsPolyfill: boolean,
  load: () => Promise<unknown>,
): () => boolean {
  let loaded = false;
  const promise: Promise<void> | null = needsPolyfill
    ? load()
        .catch(() => {})
        .then(() => {
          loaded = true;
          return undefined;
        })
    : null;

  return function usePolyfillGate(): boolean {
    const [ready, setReady] = useState<boolean>(!promise || loaded);

    useEffect(() => {
      if (promise && !ready) {
        void promise.then(() => setReady(true));
      }
    }, [ready]);

    return ready;
  };
}
