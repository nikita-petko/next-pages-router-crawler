/**
 * localStorage-backed CRUD client for recently visited history.
 *
 * Handles reading, writing, deduplication, and age-based filtering of
 * history items. Supports per-user storage isolation — each authenticated
 * user gets their own localStorage key, while anonymous browsing uses a
 * shared default key. On login, anonymous history is merged into the
 * user-scoped key. Legacy storage keys are migrated on first access.
 */

import type { HistoryConfig } from '../config';
import { HISTORY_CONFIG, STORAGE_KEY, LEGACY_STORAGE_KEYS, getStorageKey } from '../config';
import type { HistoryItem } from '../schema';
import { HistoryItemSchema } from '../schema';
import safeLocalStorage from '../utils/safeLocalStorage';

/**
 * Attempt to convert a legacy flat item (e.g. old doc-site TSearchListItem)
 * into the current HistoryItem shape. Returns null if the item doesn't look
 * like a flat entry or is missing required fields.
 *
 * Legacy format: `{ id, title, path, accessedAt, type, label, isTitleCode, ... }`
 * Current format: `{ id, accessedAt, metadata: { title, path, ... } }`
 */
function migrateFlatItem(raw: Record<string, unknown>): HistoryItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  if (raw.metadata) {
    return null;
  } // already in new format

  const { title } = raw;
  const path = raw.path ?? raw.id;
  if (typeof title !== 'string' || !title) {
    return null;
  }
  if (typeof path !== 'string' || !path) {
    return null;
  }

  const id = typeof raw.id === 'string' && raw.id ? raw.id : path;

  let accessedAt = Date.now();
  if (typeof raw.accessedAt === 'number') {
    accessedAt = raw.accessedAt;
  } else if (typeof raw.accessedAt === 'string') {
    accessedAt = new Date(raw.accessedAt).getTime() || Date.now();
  }

  const { id: _id, accessedAt: _at, ...rest } = raw;
  return {
    id,
    accessedAt,
    metadata: { title: title as string, path: path as string, ...rest },
  } as HistoryItem;
}

/**
 * Read and validate history items from localStorage.
 * Uses per-item safeParse so a single corrupt item doesn't discard
 * the entire list — only invalid items are silently dropped.
 *
 * Also handles legacy flat items (no `metadata` wrapper) by attempting
 * migration before validation.
 */
function readFromStorage(key: string): HistoryItem[] {
  try {
    const stored = safeLocalStorage.getItem(key);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.reduce<HistoryItem[]>((acc, raw) => {
      const result = HistoryItemSchema.safeParse(raw);
      if (result.success) {
        acc.push(result.data);
        return acc;
      }

      const migrated = migrateFlatItem(raw);
      if (migrated) {
        const migratedResult = HistoryItemSchema.safeParse(migrated);
        if (migratedResult.success) {
          acc.push(migratedResult.data);
        }
      }
      return acc;
    }, []);
  } catch {
    return [];
  }
}

/**
 * CRUD client for recently visited history, backed by localStorage.
 *
 * All public methods are async (returning Promises) to allow a future
 * migration to an async storage backend without breaking consumers.
 */
class HistoryClient {
  /** Merged config — HISTORY_CONFIG defaults + any overrides from constructor. */
  private config: HistoryConfig;

  /** Active localStorage key. Defaults to anonymous; updated by {@link setActiveUser}. */
  private storageKey = STORAGE_KEY;

  /** Currently active user ID, or undefined for anonymous. */
  private currentUserId: string | undefined;

  /** Pre-computed cutoff timestamp — items older than this are filtered out. */
  private maxDaysAgoTimestamp: number;

  /**
   * In-memory flag — resets on each page load and when the active user
   * changes. The singleton keeps it true for the lifetime of the session,
   * and migrateIfNeeded() exits early (one cheap localStorage read) when
   * the active key already has data.
   */
  private hasMigrated = false;

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = {
      ...HISTORY_CONFIG,
      ...config,
    };
    this.maxDaysAgoTimestamp = Date.now() - this.config.maxDaysAgo * 24 * 60 * 60 * 1000;
  }

  /**
   * Switch the active user. Call on login/logout to isolate history.
   *
   * - On login (anonymous → authenticated): merges anonymous browsing
   *   history into the user-scoped key, then clears the anonymous key.
   * - On logout (authenticated → anonymous): switches back to the
   *   anonymous key; the user's scoped data stays intact for next login.
   * - No-op if the userId hasn't changed.
   */
  setActiveUser(userId?: string): void {
    const newKey = getStorageKey(userId);
    if (newKey === this.storageKey) {
      return;
    }

    const wasAnonymous = !this.currentUserId;
    this.currentUserId = userId;
    this.storageKey = newKey;
    this.hasMigrated = false;

    if (wasAnonymous && userId) {
      this.migrateAnonymousToUser();
    }
  }

  /**
   * Merge anonymous browsing history into the user-scoped key.
   * Deduplicates by id, keeping the newer item. Clears the anonymous
   * key after migration so items aren't merged again.
   */
  private migrateAnonymousToUser(): void {
    const anonymousKey = getStorageKey();
    const anonymousItems = readFromStorage(anonymousKey);
    if (anonymousItems.length === 0) {
      return;
    }

    const userItems = readFromStorage(this.storageKey);

    const deduped = new Map<string, HistoryItem>();
    anonymousItems.forEach((item) => deduped.set(item.id, item));
    userItems.forEach((item) => {
      const existing = deduped.get(item.id);
      if (!existing || item.accessedAt > existing.accessedAt) {
        deduped.set(item.id, item);
      }
    });

    const merged = Array.from(deduped.values())
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, this.config.maxStoredItems);

    safeLocalStorage.setItem(this.storageKey, JSON.stringify(merged));
    safeLocalStorage.removeItem(anonymousKey);
  }

  /**
   * One-time migration from legacy storage keys into the active key.
   * Skips if already migrated (in-memory flag) or if the active key
   * already has data. Deduplicates by id, keeping the most recent entry.
   */
  private migrateIfNeeded(): void {
    if (this.hasMigrated) {
      return;
    }
    this.hasMigrated = true;

    // If active key already has data, nothing to migrate
    const currentItems = readFromStorage(this.storageKey);
    if (currentItems.length > 0) {
      return;
    }

    const legacyItems: HistoryItem[] = [];
    LEGACY_STORAGE_KEYS.forEach((key) => {
      legacyItems.push(...readFromStorage(key));
    });

    if (legacyItems.length === 0) {
      return;
    }

    // Deduplicate by id — keep whichever has the newer accessedAt
    const deduped = new Map<string, HistoryItem>();
    legacyItems.forEach((item) => {
      const existing = deduped.get(item.id);
      if (!existing || item.accessedAt > existing.accessedAt) {
        deduped.set(item.id, item);
      }
    });

    const merged = Array.from(deduped.values())
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, this.config.maxStoredItems);

    safeLocalStorage.setItem(this.storageKey, JSON.stringify(merged));

    // Clean up legacy keys so migration doesn't run again
    LEGACY_STORAGE_KEYS.forEach((key) => {
      safeLocalStorage.removeItem(key);
    });
  }

  /**
   * Read all items from storage, trigger migration if needed,
   * and filter out entries older than maxDaysAgo.
   */
  private getAllFilteredItems(): HistoryItem[] {
    this.migrateIfNeeded();
    const items = readFromStorage(this.storageKey);
    return items.filter((item) => item.accessedAt && item.accessedAt >= this.maxDaysAgoTimestamp);
  }

  /**
   * Return recently visited items, most-recent first.
   * @param limit  Max items to return (defaults to config.maxItems).
   */
  async getRecentlyVisited(limit?: number): Promise<HistoryItem[]> {
    try {
      const filtered = this.getAllFilteredItems();
      return filtered.slice(0, limit ?? this.config.maxItems);
    } catch {
      return [];
    }
  }

  /**
   * Add or update a history item. Deduplicates at two levels:
   * 1. Exact id match — replaces the existing entry.
   * 2. Same pathname (before ?) + same title, **only when at most one of
   *    the two has kept query params**. This collapses a bare URL with its
   *    default-tab equivalent (e.g. `/matchmaking` vs
   *    `/matchmaking?activeTab=Configuration`) when titles match, but
   *    keeps entries with different explicit params as distinct pages
   *    (e.g. `?activeTab=Configuration` vs `?activeTab=Attributes`).
   *
   * The new item is prepended (most-recent-first) and the list is
   * trimmed to maxStoredItems.
   */
  async addToRecentlyVisited(item: HistoryItem): Promise<void> {
    if (!item.metadata?.path || !item.metadata?.title) {
      return;
    }

    try {
      const currentItems = this.getAllFilteredItems();
      const newPathname = item.id.split('?')[0];
      const newHasParams = item.id.includes('?');

      const filteredItems = currentItems.filter((existing) => {
        // Level 1: exact id match
        if (existing.id === item.id) {
          return false;
        }

        // Level 2: bare URL ↔ default-tab URL with same title
        // Only applies when at most one side has kept query params.
        // If both have distinct params, they're intentionally separate.
        const existingPathname = existing.id.split('?')[0];
        if (existingPathname === newPathname && existing.metadata.title === item.metadata.title) {
          const existingHasParams = existing.id.includes('?');
          if (!existingHasParams || !newHasParams) {
            return false;
          }
        }

        return true;
      });

      const updated = [item, ...filteredItems].slice(0, this.config.maxStoredItems);

      safeLocalStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Silently ignore — safeLocalStorage handles all storage errors
    }
  }

  /**
   * Remove a single item by id and persist the updated list.
   * @returns The remaining items (capped at maxItems).
   */
  async removeFromRecentlyVisited(itemId: string): Promise<HistoryItem[]> {
    try {
      const currentItems = this.getAllFilteredItems();
      const filteredItems = currentItems.filter((existing) => existing.id !== itemId);

      safeLocalStorage.setItem(this.storageKey, JSON.stringify(filteredItems));

      return filteredItems.slice(0, this.config.maxItems);
    } catch {
      return [];
    }
  }

  /** Delete all history from localStorage. */
  async clearHistory(): Promise<void> {
    try {
      safeLocalStorage.removeItem(this.storageKey);
    } catch {
      // Silently ignore — safeLocalStorage handles all storage errors
    }
  }
}

/** Singleton instance used by HistoryProvider and consumers. */
const historyClient = new HistoryClient();

export default historyClient;
export { HistoryClient };
