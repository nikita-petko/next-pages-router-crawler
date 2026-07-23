/**
 * Strips query parameters that don't represent a distinct page.
 *
 * Only params listed in `queryParamsToKeep` (e.g. `activeTab`, `tab`) are
 * preserved — these change what the user sees and should produce separate
 * history entries. All other params (tracking, pagination, etc.) are removed
 * so they don't create duplicate entries for the same page.
 *
 * Returns an `id` for deduplication, a `cleanedUrl` for display/storage,
 * and the `originalUrl` before stripping.
 */

import { HISTORY_CONFIG } from '../config';

export type LocationParts = {
  origin: string;
  pathname: string;
  search: string;
};

function cleanUrl(location: LocationParts): {
  id: string;
  cleanedUrl: string;
  originalUrl: string;
} {
  const { origin, pathname, search } = location;

  const originalUrl = `${origin}${pathname}${search}`;

  const queryParams = new URLSearchParams(search);
  Array.from(queryParams.keys())
    .filter((key) => !HISTORY_CONFIG.queryParamsToKeep.includes(key))
    .forEach((key) => queryParams.delete(key));

  queryParams.sort();
  const queryString = queryParams.toString();
  const id = `${pathname}${queryString ? `?${queryString}` : ''}`;
  const cleanedUrl = `${origin}${id}`;

  return { id, cleanedUrl, originalUrl };
}

export default cleanUrl;
