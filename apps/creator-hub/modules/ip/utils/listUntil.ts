/**
 * Paginates through a list API until a matching item is found or all pages are exhausted.
 *
 * Unlike {@link listAll}, this stops as soon as `predicate` returns true for an item,
 * making it suitable for existence checks over potentially large libraries.
 */
const listUntil = async <TResponse, TItem>({
  api,
  getItems,
  getPageToken,
  predicate,
}: {
  /** Function making the API call with an optional page token */
  api: (pageToken: string | undefined) => Promise<TResponse>;
  /** Function that extracts the items from the API response */
  getItems: (response: TResponse) => TItem[];
  /** Function that extracts the next page token from the API response */
  getPageToken: (response: TResponse) => string | undefined;
  /** Returns true when the desired item has been found */
  predicate: (item: TItem) => boolean;
}): Promise<TItem | undefined> => {
  let pageToken: string | undefined;
  do {
    const response = await api(pageToken);
    const match = getItems(response).find(predicate);
    if (match) {
      return match;
    }
    pageToken = getPageToken(response);
  } while (pageToken);

  return undefined;
};

export default listUntil;
