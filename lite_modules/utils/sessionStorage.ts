export enum SessionStorageKeys {
  PREVIOUS_PAGE = 'previousPage',
}

type ValueTypes = string | number | boolean | null;

export const SetSessionStorage = (key: SessionStorageKeys, value: ValueTypes) => {
  window.sessionStorage.setItem(key, JSON.stringify(value));
};

export const GetSessionStorage = (key: SessionStorageKeys, defaultValue?: ValueTypes) => {
  const value = window.sessionStorage.getItem(key);
  return value ? JSON.parse(value) : defaultValue;
};
