import { useRouter } from 'next/router';

/**
 * Retrieves the experiment ID (string) from the path. Should never error within this
 * module - the page will not load if a experiment ID is not present.
 *
 * Use this to reduce dependent queries and minmimize request waterfall.
 */
// eslint-disable-next-line import/prefer-default-export -- keep named export
export function useExperimentId() {
  const router = useRouter();
  const { experimentId } = router.query;

  if (!router.isReady) {
    return { isLoading: true, isError: false } as const;
  }

  if (!experimentId || Array.isArray(experimentId)) {
    return { isLoading: false, isError: true } as const;
  }

  return { experimentId, isLoading: false, isError: false } as const;
}
