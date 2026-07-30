const CREATIONS_PATH = '/dashboard/creations';
// Reserved parsing base for rooted relative URLs; it is never used as a navigation destination.
const RELATIVE_URL_BASE = 'https://relative.invalid';

export const PUBLISHING_CONSOLIDATION_RETURN_TO_QUERY_KEY = 'publishingConsolidationReturnTo';

export const addPublishingConsolidationReturnTo = (
  destination: string,
  returnTo: string,
): string => {
  const parsedDestination = new URL(destination, RELATIVE_URL_BASE);
  parsedDestination.searchParams.set(PUBLISHING_CONSOLIDATION_RETURN_TO_QUERY_KEY, returnTo);

  return parsedDestination.origin === RELATIVE_URL_BASE
    ? `${parsedDestination.pathname}${parsedDestination.search}${parsedDestination.hash}`
    : parsedDestination.toString();
};

export const getPublishingConsolidationReturnTo = (
  queryValue: string | string[] | undefined,
): string | undefined => {
  const returnTo = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (!returnTo?.startsWith('/')) {
    return undefined;
  }

  try {
    const parsedReturnTo = new URL(returnTo, RELATIVE_URL_BASE);
    if (parsedReturnTo.origin !== RELATIVE_URL_BASE || parsedReturnTo.pathname !== CREATIONS_PATH) {
      return undefined;
    }

    return `${parsedReturnTo.pathname}${parsedReturnTo.search}${parsedReturnTo.hash}`;
  } catch {
    return undefined;
  }
};
