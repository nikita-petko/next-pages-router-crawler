/**
 * Creates a api-like function that wraps a paginated API that will fetch
 * all items in the list by making multiple requests.
 *
 * **NOTE**: Do not use when we have lots of pages.
 *
 * Primary use case is when the API is technically paginated
 * but we expect relatively few responses.
 *
 * Example:
 * ```
 * const licenses = await listAll({
 *   api: (pageToken: string | undefined) =>
 *     contentLicensingClient.listLicensesByIpListing(accountId, listingId, 100, pageToken),
 *   getItems: (response) => response.licenses || [],
 *   getPageToken: (response) => response.nextPageToken,
 * });
 * ```
 */
const listAll = async <TResponse, TItem>({
  api,
  getItems,
  getPageToken,
}: {
  /** Function making the API call with an optional page token */
  api: (pageToken: string | undefined) => Promise<TResponse>;
  /** Function that extracts the items from the API response */
  getItems: (response: TResponse) => TItem[];
  /** Function that extracts the next page token from the API response */
  getPageToken: (response: TResponse) => string | undefined;
}) => {
  let items: TItem[] = [];
  let pageToken: string | undefined;
  do {
    const response = await api(pageToken);
    items = items.concat(getItems(response));
    pageToken = getPageToken(response);
  } while (pageToken);

  return items;
};

export default listAll;
