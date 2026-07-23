import { useRouter } from 'next/router';

/**
 * Retrieves the pass ID from the path. Should never error within this
 * module - the page will not load if a pass ID is not present.
 *
 * Use this to reduce dependent queries and minmimize request waterfall.
 */
// eslint-disable-next-line import/prefer-default-export -- keep named export
export function usePassId() {
  const router = useRouter();
  const routerQueryId = router.query.passId;

  if (!router.isReady) {
    return { isLoading: true, isError: false } as const;
  }

  if (!routerQueryId || Array.isArray(routerQueryId)) {
    return { isLoading: false, isError: true } as const;
  }
  const passId = Number(routerQueryId);
  if (Number.isNaN(passId) || !Number.isInteger(passId)) {
    return { isLoading: false, isError: true } as const;
  }
  return { passId, isLoading: false, isError: false } as const;
}
