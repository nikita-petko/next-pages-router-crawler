import { useRouter } from 'next/router';

/**
 * Retrieves the universe ID from the path. Should never error within this
 * module - the page will not load if a universe ID is not present.
 *
 * Use this to reduce dependent queries and minmimize request waterfall.
 */
// eslint-disable-next-line import/prefer-default-export -- keep named export
export function useUniverseId() {
  const router = useRouter();
  const routerQueryId = router.query.id;

  if (!router.isReady) {
    return { isLoading: true, isError: false } as const;
  }

  if (!routerQueryId || Array.isArray(routerQueryId)) {
    return { isLoading: false, isError: true } as const;
  }
  const universeId = Number(routerQueryId);
  if (Number.isNaN(universeId) || !Number.isInteger(universeId)) {
    return { isLoading: false, isError: true } as const;
  }
  return { universeId, isLoading: false, isError: false } as const;
}
