import { createContext, useRef, useContext, type ReactNode, useLayoutEffect } from 'react';
import { createSelectionStore, type SelectionConfig, type SelectionStoreParams } from './store';

const TableSelectionContext = createContext<unknown>(null);

type WithNever<T extends object> = { [K in keyof T]?: never };

type TableSelectionProviderPropsWithoutStore<K extends string | number, T> = SelectionConfig<T> &
  SelectionStoreParams<K, T> & {
    /** The store is not provided */
    store?: never;
  };

type TableSelectionProviderPropsWithStore<K extends string | number, T> = WithNever<
  SelectionConfig<T>
> &
  Partial<WithNever<SelectionStoreParams<K, T>>> & {
    /** Optional store to use instead of creating a new one */
    store: ReturnType<typeof createSelectionStore<K, T>>;
  };

export type TableSelectionProviderProps<K extends string | number, T> = {
  children: ReactNode;
} & (TableSelectionProviderPropsWithoutStore<K, T> | TableSelectionProviderPropsWithStore<K, T>);

/**
 * Creates a singleton instance of the selection store.
 * @param storeParams - Store configuration callbacks (identifier, selectable).
 * @param dataProps - The initial dataset and configuration.
 * @param store - Optional external store to use instead of creating a new one.
 * @returns The singleton instance of the selection store.
 */
export function useTableSelectionStoreInstance<K extends string | number, T>(
  storeParams: SelectionStoreParams<K, T>,
  dataProps: SelectionConfig<T>,
  store?: ReturnType<typeof createSelectionStore<K, T>>,
): ReturnType<typeof createSelectionStore<K, T>> {
  const storeRef = useRef<ReturnType<typeof createSelectionStore<K, T>>>(undefined);

  if (!storeRef.current) {
    storeRef.current = store ?? createSelectionStore(storeParams, dataProps);
  }

  // Push new arrays/limits into the store whenever they change.
  // useLayoutEffect ensures the store is updated before children render and calculate stats.
  useLayoutEffect(() => {
    storeRef.current?.syncData(dataProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is correct
  }, [dataProps.currentPage, dataProps.items, dataProps.mode, dataProps.limit, dataProps.disabled]);

  return storeRef.current;
}

/**
 * Context Provider that holds the singleton instance of the Selection Store.
 *
 * @example
 * <TableSelectionProvider identifier={(user) => user.id} currentPage={users} mode="page" limit={100}>
 *   <MyTable />
 * </TableSelectionProvider>
 */
export function TableSelectionProvider<K extends string | number, T>({
  children,
  identifier,
  selectable,
  store,
  currentPage,
  items,
  mode,
  limit,
  disabled,
}: TableSelectionProviderProps<K, T>) {
  const storeRef = useRef<ReturnType<typeof createSelectionStore<K, T>>>(undefined);

  if (!storeRef.current) {
    storeRef.current =
      store ??
      createSelectionStore(
        { identifier, selectable },
        { currentPage, items, mode, limit, disabled },
      );
  }

  // Push new arrays/limits into the store whenever they change.
  // useLayoutEffect ensures the store is updated before children render and calculate stats.
  useLayoutEffect(() => {
    if (!currentPage && !items && !mode && !limit && !disabled) return;

    storeRef.current?.syncData({ currentPage, items, mode, limit, disabled });
  }, [currentPage, items, mode, limit, disabled]);

  return (
    <TableSelectionContext.Provider value={storeRef.current}>
      {children}
    </TableSelectionContext.Provider>
  );
}

/** Internal helper to grab the strongly-typed store from context. */
export function useTableSelectionContext<K extends string | number, T>(): ReturnType<
  typeof createSelectionStore<K, T>
> {
  const store = useContext(TableSelectionContext);
  if (!store) {
    throw new Error('Hooks must be used within a SelectionProvider');
  }
  return store as ReturnType<typeof createSelectionStore<K, T>>;
}
