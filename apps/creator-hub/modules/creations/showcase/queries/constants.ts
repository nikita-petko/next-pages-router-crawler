export const DEFAULT_RETRIES = 3 as number;

/** Showcases change only on publish/delete, so a short stale time is enough. */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

export const showcaseKeys = {
  all: ['showcases'] as const,

  byCommunity: (communityId: number) => [...showcaseKeys.all, 'byCommunity', communityId] as const,
  detail: (showcaseId: string) => [...showcaseKeys.all, 'detail', showcaseId] as const,
  quota: (communityId: number) => [...showcaseKeys.all, 'quota', communityId] as const,

  eligibleItems: (communityId: number, page: number, pageSize: number) =>
    [...showcaseKeys.all, 'eligibleItems', communityId, page, pageSize] as const,
} as const;
