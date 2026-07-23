import createUseStorage, { SetValue } from './createUseStorage';

const useLocalStorage = <T>(key: string, initialValue: T): [T, SetValue<T>] => {
  return createUseStorage<T>(() => window.localStorage, 'local-storage')(key, initialValue);
};

export default useLocalStorage;
