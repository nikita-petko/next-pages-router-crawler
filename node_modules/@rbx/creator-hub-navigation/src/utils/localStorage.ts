export function get<T>(key: string): T | null {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return null;
  }
}

export function set<T>(key: string, value: T) {
  try {
    // Save to local storage
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Error setting localStorage key “${key}”:`, error);
  }
}
