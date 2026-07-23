import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import type BreadcrumbItemType from '../enums/BreadcrumbsItemType';

type ItemNameRegistry = Partial<Record<BreadcrumbItemType, string | undefined>>;

type BreadcrumbItemNameContextValue = {
  getSnapshot: () => ItemNameRegistry;
  subscribe: (cb: () => void) => () => void;
  register: (type: BreadcrumbItemType, name: string | undefined) => void;
  unregister: (type: BreadcrumbItemType) => void;
};

const BreadcrumbItemNameContext = createContext<BreadcrumbItemNameContextValue | null>(null);

export function BreadcrumbItemNameProvider({ children }: { children?: ReactNode }) {
  const registryRef = useRef<ItemNameRegistry>({});
  const listenersRef = useRef<Set<() => void>>(new Set());

  const getSnapshot = useCallback(() => registryRef.current, []);

  const subscribe = useCallback((cb: () => void) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const notify = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  const register = useCallback(
    (type: BreadcrumbItemType, name: string | undefined) => {
      if (registryRef.current[type] !== name) {
        registryRef.current = { ...registryRef.current, [type]: name };
        notify();
      }
    },
    [notify],
  );

  const unregister = useCallback(
    (type: BreadcrumbItemType) => {
      if (type in registryRef.current) {
        const next = { ...registryRef.current };
        delete next[type];
        registryRef.current = next;
        notify();
      }
    },
    [notify],
  );

  const value = useMemo(
    () => ({ getSnapshot, subscribe, register, unregister }),
    [getSnapshot, subscribe, register, unregister],
  );

  return (
    <BreadcrumbItemNameContext.Provider value={value}>
      {children}
    </BreadcrumbItemNameContext.Provider>
  );
}

// useSyncExternalStore subscribes only consuming components to registry changes,
// avoiding re-rendering the entire provider subtree when a breadcrumb name updates.
export function useBreadcrumbItemNames(): ItemNameRegistry {
  const context = useContext(BreadcrumbItemNameContext);
  if (!context) {
    throw new Error('useBreadcrumbItemNames must be used within an BreadcrumbItemNameProvider');
  }
  return useSyncExternalStore(context.subscribe, context.getSnapshot, context.getSnapshot);
}

export function useBreadcrumbRegister() {
  const context = useContext(BreadcrumbItemNameContext);
  if (!context) {
    throw new Error('useBreadcrumbRegister must be used within an BreadcrumbItemNameProvider');
  }
  return context;
}
