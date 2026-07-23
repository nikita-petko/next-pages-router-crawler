import type { SetValue } from './createUseStorage';
import createUseStorage from './createUseStorage';

const useLocalStorage = <T>(key: string, initialValue: T): [T, SetValue<T>] => {
  return createUseStorage<T>(() => window.localStorage, 'local-storage')(key, initialValue);
};

export default useLocalStorage;
