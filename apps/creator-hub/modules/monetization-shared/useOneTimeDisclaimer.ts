import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createStore, type Store } from './lib/store';

export type UseOneTimeDisclaimerState = {
  isOpen: boolean;
  accept: () => void;
  close: () => void;
};

export type UseOneTimeDisclaimerReturn = {
  withDisclaimer: (
    callback: () => unknown | Promise<unknown>,
    options?: { enabled?: boolean },
  ) => Promise<void>;
};

export type DisclaimerStore = Partial<
  Record<string, { isOpen?: boolean; onAccept?: (...args: unknown[]) => unknown }>
>;

const disclaimerStore = createStore<DisclaimerStore>({});

const getKeyState =
  (key: string, store: Store<DisclaimerStore> = disclaimerStore) =>
  () =>
    store.getSnapshot()[key];

const setKeyState = (
  key: string,
  value: { isOpen?: boolean; onAccept?: (...args: unknown[]) => unknown },
  store: Store<DisclaimerStore> = disclaimerStore,
) => store.setState({ [key]: value });

/**
 * Simple hook to manage a one-time disclaimer state internally.
 *
 * @param key - The key to use for the disclaimer state.
 * @param options.setAccepted - A function to set the disclaimer as accepted.
 * @param options.onAccept - A default callback that's executed when the disclaimer is accepted.
 * @param store - The global store to use for storing disclaimer state and callbacks.
 */
export function useOneTimeDisclaimerState(
  key: string,
  options: {
    setAccepted: (k: string) => void | Promise<void>;
    onAccept?: (...args: unknown[]) => unknown;
  },
  store: Store<DisclaimerStore> = disclaimerStore,
): UseOneTimeDisclaimerState {
  const { setAccepted, onAccept: defaultOnAccept } = options;

  const { isOpen = false, onAccept } =
    useSyncExternalStore(store.subscribe, getKeyState(key, store)) ?? {};

  const close = useCallback(() => setKeyState(key, { isOpen: false }), [key]);

  const accept = useCallback(async () => {
    close();
    await setAccepted(key);
    onAccept?.();
    defaultOnAccept?.();
  }, [close, key, onAccept, setAccepted, defaultOnAccept]);

  return useMemo(() => ({ isOpen, accept, close }) as const, [isOpen, accept, close]);
}

/**
 * Simple hook to manage a one-time disclaimer state externally. Exposes
 * a wrapper function to handle the disclaimer state.
 *
 * @param key - The key to use for the disclaimer state.
 * @param options.hasAccepted - A boolean or callback to check if the disclaimer has been accepted.
 * @param store - The global store to use for storing disclaimer state and callbacks.
 */
export function useOneTimeDisclaimer(
  key: string,
  options: { hasAccepted: boolean | ((k: string) => boolean | Promise<boolean>) },
  store: Store<DisclaimerStore> = disclaimerStore,
): UseOneTimeDisclaimerReturn {
  const { hasAccepted } = options;

  const withDisclaimer = useCallback(
    async (
      callback: () => unknown | Promise<unknown>,
      { enabled = true }: { enabled?: boolean } = {},
    ) => {
      const hasAcceptedDisclaimer =
        typeof hasAccepted === 'function' ? await hasAccepted(key) : hasAccepted;
      if (hasAcceptedDisclaimer || !enabled) {
        await callback();
      } else {
        setKeyState(key, { isOpen: true, onAccept: callback }, store);
      }
    },
    [hasAccepted, key, store],
  );

  return { withDisclaimer } as const;
}
