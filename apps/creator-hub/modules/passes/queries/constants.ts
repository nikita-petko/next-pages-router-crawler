import type { Query } from '@tanstack/react-query';

export const DEFAULT_RETRIES = 1 as number;
export const DEFAULT_STALE_TIME = Infinity;

export const MAX_WRITE_LIMIT = 50 as number;

export const gamePassKeys = {
  all: (universeId: number) => ['passes', universeId] as const,
  listAll: (universeId: number, params?: { pageSize?: number; isArchived?: boolean }) =>
    [...gamePassKeys.all(universeId), 'listAll', params] as const,
  config: (universeId: number, gamePassId: number) =>
    [...gamePassKeys.all(universeId), 'config', gamePassId] as const,
  batchConfigs: (universeId: number, gamePassIds: number[]) =>
    // Sort the game pass IDs to ensure consistent query keys
    [...gamePassKeys.all(universeId), 'batchConfigs', [...gamePassIds].sort((a, b) => a - b)],
  create: (universeId: number) => [...gamePassKeys.all(universeId), 'create'] as const,
  update: (universeId: number, gamePassId: number) =>
    [...gamePassKeys.all(universeId), gamePassId, 'update'] as const,
  batchUpdate: (universeId: number) => [...gamePassKeys.all(universeId), 'batchUpdate'] as const,
  bonusOptIn: (universeId: number, gamePassId: number) =>
    [...gamePassKeys.all(universeId), gamePassId, 'bonusOptIn'] as const,
  metadata: () => ['passes', 'metadata'] as const,
};

/**
 * Predicate that matches any `gamePassKeys.listAll(universeId, ...)` query.
 * Key shape: `['passes', universeId, 'listAll', { pageSize?: number; isArchived?: boolean }]`
 */
export function matchesGamePassListAllQuery(query: Query, universeId: number): boolean {
  const key = query.queryKey;
  return key[0] === 'passes' && key[1] === universeId && key[2] === 'listAll';
}

/**
 * Predicate that matches any `gamePassKeys.batchConfigs(universeId, ...)` query.
 * Key shape: `['passes', universeId, 'batchConfigs', number[]]`
 */
export function matchesGamePassBatchConfigsQuery(query: Query, universeId: number): boolean {
  const key = query.queryKey;
  return (
    key[0] === 'passes' &&
    key[1] === universeId &&
    key[2] === 'batchConfigs' &&
    Array.isArray(key[3])
  );
}
