import {
  COLLAPSED_SIZE,
  DEFAULT_POSITION,
  POSITION_STORAGE_KEY,
  RECENTLY_CHANGED_STORAGE_KEY,
} from './constants';
import type { Position, RecentEntry } from './widgetTypes';

const isBrowser = () => typeof window !== 'undefined';

const getStorageItem = (key: string): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(key);
};

export const setStorageItem = (key: string, value: string): void => {
  if (isBrowser()) {
    localStorage.setItem(key, value);
  }
};

function readStoredValue(key: string): unknown {
  const raw = getStorageItem(key);
  if (raw === null) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function readStringArray(key: string): string[] {
  const parsed = readStoredValue(key);
  return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? parsed : [];
}

function isRecentEntry(value: unknown): value is RecentEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'namespace' in value &&
    'name' in value &&
    'changedAt' in value &&
    typeof value.namespace === 'string' &&
    typeof value.name === 'string' &&
    typeof value.changedAt === 'number'
  );
}

export function readRecentEntries(): RecentEntry[] {
  const parsed = readStoredValue(RECENTLY_CHANGED_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed.filter(isRecentEntry) : [];
}

export function readPosition(): Position {
  if (!isBrowser()) {
    return DEFAULT_POSITION;
  }

  const raw = localStorage.getItem(POSITION_STORAGE_KEY);
  if (raw === null) {
    return { x: window.innerWidth - COLLAPSED_SIZE - 20, y: 60 };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'x' in parsed &&
      'y' in parsed &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number'
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    // Ignore malformed persisted positions.
  }

  return DEFAULT_POSITION;
}

export function writePosition(position: Position): void {
  setStorageItem(POSITION_STORAGE_KEY, JSON.stringify(position));
}

export function getBoundedPosition(position: Position): Position {
  if (!isBrowser()) {
    return position;
  }

  return {
    x: Math.min(Math.max(0, position.x), Math.max(0, window.innerWidth - COLLAPSED_SIZE)),
    y: Math.min(Math.max(0, position.y), Math.max(0, window.innerHeight - COLLAPSED_SIZE)),
  };
}
