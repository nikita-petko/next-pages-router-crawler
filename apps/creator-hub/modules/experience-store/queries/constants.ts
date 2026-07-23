export const DEFAULT_RETRIES = 3;
export const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - we don't expect this to change frequently

export const experienceStoreKeys = {
  experienceStoreState: (universeId: number) => ['experienceStoreState', universeId] as const,
} as const;
