import { useEffect, useState } from 'react';

interface StoredItem<T> {
  version: string;
  value: T;
}
/**
 * useInitialLocalStorage does an initial load from local storage into memory and then saves to local storage asychronously on every change.
 * This is done on a best-effort basis. Values returned are those in memory.
 *
 * This prioritizes avoiding latency over having a single source of truth. If there are multiple tabs open, they will not be in sync, and
 * only one tab's state will be saved.
 *
 * @param key The key to use in local storage
 * @param initialValue The initial value to use if the key is not found in local storage or if loading fails
 * @param version The version of the local storage value. If the version changes, the value will be reset to the initialValue.
 * @param deserializer A function to convert the stored JSON-friendly value into the type. Can throw if the value is invalid. Must be stable.
 * @param serializer A function to convert the stored type into a JSON-friendly value. Should be stable. If not provided, the value will be stored directly.
 *
 */
const useInitalLocalStorage = <T,>(
  key: string,
  initialValue: T,
  version: string,
  deserializer: (item: unknown) => T,
  serializer?: (item: T) => unknown,
) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as StoredItem<T>;
        if (parsedValue.version === version) {
          return deserializer(parsedValue.value);
        }
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      const serialized = serializer ? serializer(value) : value;
      const storedItem = JSON.stringify({ version, value: serialized });
      localStorage.setItem(key, storedItem);
    } catch {
      // fail silently. Saving is only best effort.
    }
  }, [key, value, serializer, version]);

  return [value, setValue] as const;
};

export default useInitalLocalStorage;
