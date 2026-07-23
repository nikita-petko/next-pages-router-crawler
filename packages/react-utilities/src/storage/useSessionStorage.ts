import createUseStorage, { SetValue } from './createUseStorage';

const useSessionStorage = <T>(key: string, initialValue: T): [T, SetValue<T>] => {
  return createUseStorage<T>(() => window.sessionStorage, 'session-storage')(key, initialValue);
};

export default useSessionStorage;
