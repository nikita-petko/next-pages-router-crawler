import { useEffect, useState, useCallback, Dispatch, SetStateAction, useRef } from 'react';
import useEventCallback from '../useEventCallback';

export type SetValue<T> = Dispatch<SetStateAction<T>>;

// Adapted from https://usehooks.com/uselocalstorage
// Modified to be a factory so this can be used for both localStorage and sessionStorage
const createUseStorage = <T>(getStorage: () => Storage, eventName: string) => {
  return (key: string, initialValue: T): [T, SetValue<T>] => {
    // Get from backingStorage then
    // parse stored json or return initialValue
    const initialValueRef = useRef(initialValue);
    const readValue = useCallback(() => {
      // Prevent build error "window is undefined" but keep implementation working
      if (typeof window === 'undefined') {
        return initialValueRef.current;
      }

      try {
        const item = getStorage().getItem(key);
        return item ? JSON.parse(item) : initialValueRef.current;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Error reading backingStorage (eventName: ${eventName}) key “${key}”:`, error);
        return initialValueRef.current;
      }
    }, [key]);

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => readValue());

    useEffect(() => {
      setStoredValue(readValue);
    }, [readValue]);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to backingStorage.
    const setValue: SetValue<T> = useEventCallback((value) => {
      // Prevent build error "window is undefined" but keeps working
      if (typeof window === 'undefined') {
        // eslint-disable-next-line no-console
        console.warn(
          `Tried setting backingStorage (eventName: ${eventName}) key “${key}” even though environment is not a client`,
        );
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;

        const stringifiedNewValue = JSON.stringify(newValue);
        const previousValue = getStorage().getItem(key);

        if (stringifiedNewValue !== previousValue) {
          // Save to backingStorage
          getStorage().setItem(key, stringifiedNewValue);

          // Save state
          setStoredValue(newValue);

          // We dispatch a custom event so every hook is notified
          window.dispatchEvent(
            new CustomEvent(eventName, {
              detail: {
                key,
                newValue,
              },
            }),
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Error setting backingStorage (eventName: ${eventName}) key “${key}”:`, error);
      }
    });

    useEffect(() => {
      const handleStorageChangeInThisWindow = (event: CustomEvent) => {
        const { key: changedKey, newValue } = event.detail;
        if (changedKey === key) {
          setStoredValue(newValue);
        }
      };

      const handleStorageChangeInAnotherWindow = (event: StorageEvent) => {
        const { key: changedKey, newValue } = event;
        if (event.storageArea === getStorage() && changedKey === key) {
          const value = JSON.parse(newValue as string);
          setStoredValue(value);
        }
      };

      // this only works for other documents, not the current one
      window.addEventListener('storage', handleStorageChangeInAnotherWindow);

      // this is a custom event, setValue
      window.addEventListener(eventName, handleStorageChangeInThisWindow as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChangeInAnotherWindow);
        window.removeEventListener(eventName, handleStorageChangeInThisWindow as EventListener);
      };
    }, [key]);

    return [storedValue, setValue];
  };
};

export default createUseStorage;
