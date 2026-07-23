declare global {
  interface Window {
    rbxFlags: {
      set: (namespace: string, name: string, value: unknown) => void;
      clear: () => void;
      delete: (namespace: string, name: string) => void;
    };
  }
}

const EVENT_NAME = 'flags-override';
const STORAGE_PREFIX = 'flags';

function formatStorageKey(namespace: string, name: string): string {
  return [STORAGE_PREFIX, namespace, name].join(':');
}

export const INITIAL_VERSION = 0;
let version = INITIAL_VERSION;

export function getVersion(): number {
  return version;
}

function emit(): void {
  version += 1;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key?.startsWith(`${STORAGE_PREFIX}:`)) {
    emit();
  }
}

export function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener(EVENT_NAME, callback);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener(EVENT_NAME, callback);
  };
}

export function getOverride(namespace: string, name: string): unknown {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const raw = localStorage.getItem(formatStorageKey(namespace, name));
  if (raw === null) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function register(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.rbxFlags = {
    set(namespace: string, name: string, value: unknown) {
      const key = formatStorageKey(namespace, name);
      const newValue = JSON.stringify(value);

      if (localStorage.getItem(key) === newValue) {
        return;
      }

      localStorage.setItem(key, newValue);
      emit();
    },
    clear() {
      const keys = Array.from({ length: localStorage.length }, (_, i) =>
        localStorage.key(i),
      ).filter((key): key is string => key != null && key.startsWith(`${STORAGE_PREFIX}:`));

      keys.forEach((key) => localStorage.removeItem(key));

      if (keys.length > 0) {
        emit();
      }
    },
    delete(namespace: string, name: string) {
      const key = formatStorageKey(namespace, name);

      if (localStorage.getItem(key) === null) {
        return;
      }

      localStorage.removeItem(key);
      emit();
    },
  };

  // Existing useFlag subscribers may have resolved server values before
  // asynchronous override authorization completed. Notify them to re-read
  // any persisted overrides as soon as override support becomes available.
  emit();
}
