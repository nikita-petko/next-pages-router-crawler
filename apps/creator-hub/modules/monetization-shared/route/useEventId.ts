import { useRouter } from 'next/router';

/**
 * Retrieves the experiment ID (string) from the path. Should never error within this
 * module - the page will not load if a experiment ID is not present.
 *
 * Use this to reduce dependent queries and minmimize request waterfall.
 */
export function useEventId() {
  const router = useRouter();
  const { eventId } = router.query;

  if (!router.isReady) {
    return { isLoading: true, isError: false } as const;
  }

  if (!eventId || Array.isArray(eventId)) {
    return { isLoading: false, isError: true } as const;
  }

  return { eventId, isLoading: false, isError: false } as const;
}
