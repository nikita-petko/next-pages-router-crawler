/**
 * Safe localStorage wrapper that handles:
 * - SSR environments (no window object)
 * - SecurityError (private browsing, disabled localStorage)
 * - Storage quota exceeded
 *
 * All methods fail silently and return null on error, so callers don't
 * need try/catch for storage operations.
 */

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or SecurityError — silently ignored
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      // SecurityError — silently ignored
    }
  },
};

export default safeLocalStorage;
