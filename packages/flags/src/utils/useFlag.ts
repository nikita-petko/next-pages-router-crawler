import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribe, getVersion, INITIAL_VERSION } from '../config/overrides';
import type { TContextualFlag, TFlag, TFlagContext, TStaticFlag } from '../types';

// * NOTE(@zwang, 04/12/26): `getVersion` is global — any override change re-renders all `useFlag`
// * hooks. This is fine because `defineFlag` returns the same cached promise for unchanged flags,
// * so React bails out during reconciliation.
const serverVersion = () => INITIAL_VERSION;

type TUseFlagReturn<T> = { ready: true; value: T } | { ready: false; value: null };

export default function useFlag<T>(flag: TFlag<T>): TUseFlagReturn<T>;
export default function useFlag<T, C extends TFlagContext>(
  flag: TFlag<T, C>,
  context: C,
): TUseFlagReturn<T>;
export default function useFlag<T, C extends TFlagContext>(
  ...args: [flag: TStaticFlag<T>] | [flag: TContextualFlag<T, C>, context: C]
): TUseFlagReturn<T> {
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState<T | null>(null);
  const overrideVersion = useSyncExternalStore(subscribe, getVersion, serverVersion);

  // * NOTE(@zwang, 04/24/26): context always has exactly one key, so the single value
  // * is a stable primitive for the dependency array.
  const [flagReference, contextObject = {}] = args;
  const contextValue = Object.values(contextObject).pop();
  useEffect(() => {
    const controller = new AbortController();

    async function fetchFlag() {
      try {
        let result: T;

        if (args.length === 2) {
          const [flag, context] = args;
          result = await flag(context);
        } else {
          const [flag] = args;
          result = await flag();
        }

        controller.signal.throwIfAborted();
        setValue(result);
        setReady(true);
      } catch {
        // gracefully keeping the current state
      }
    }

    void fetchFlag();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE(@zwang, 04/24/26): hand pick deps array to avoid unstable `context` object causing re-render when all that matters is the value
  }, [flagReference, contextValue, overrideVersion]);

  if (ready) {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- NOTE(@zwang, 05/05/26): guaranteed to be in sync with `ready`
    return { ready, value: value! };
  }
  return { ready: false, value: null };
}
