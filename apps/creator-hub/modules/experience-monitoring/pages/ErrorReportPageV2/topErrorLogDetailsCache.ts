import type {
  ErrorLogDetail,
  GetLogDetailsFilters,
} from '@modules/clients/analytics/universePerformanceRaqi';
import universePerformanceRaqiClient from '@modules/clients/analytics/universePerformanceRaqi';

export type TopErrorLogDetailsFetcher = (
  messageHashIds: readonly string[],
) => Promise<Map<string, ErrorLogDetail>>;

/**
 * Builds a fetcher closed over `(universeId, filters)` that resolves
 * `messageHashIds → Map<hash, ErrorLogDetail>`.
 *
 * One bulk `/log-details` request per call. The CAaaS table fans out one
 * secondary `getData` call per custom column (severity, source, message,
 * hidden stack trace text). Without dedup that would issue four back-to-back
 * `/log-details` requests with the same hash set per render — the inflight
 * cache collapses them onto a single in-flight promise keyed by the sorted
 * hash signature.
 */
const createTopErrorLogDetailsFetcher = (
  universeId: number,
  startTime: Date | null,
  endTime: Date | null,
  logDetailsFilters: GetLogDetailsFilters,
): TopErrorLogDetailsFetcher => {
  const inflight = new Map<string, Promise<Map<string, ErrorLogDetail>>>();

  return async (messageHashIds) => {
    if (messageHashIds.length === 0) {
      return new Map();
    }

    // Include the time window and filters in the cache key so filter changes
    // bust the inflight cache instead of replaying stale results.
    const cacheKey = [
      [...messageHashIds].sort().join(','),
      startTime?.toISOString() ?? '',
      endTime?.toISOString() ?? '',
      logDetailsFilters.keyword ?? '',
      logDetailsFilters.placeId ?? '',
      logDetailsFilters.placeVersions?.join(',') ?? '',
      logDetailsFilters.firstSeenPlaceVersion ?? '',
    ].join('|');
    const cached = inflight.get(cacheKey);
    if (cached) {
      return cached;
    }

    const promise = (async (): Promise<Map<string, ErrorLogDetail>> => {
      const response = await universePerformanceRaqiClient.getLogDetails({
        universeId,
        messageHashIds: [...messageHashIds],
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...logDetailsFilters,
      });
      const details = response.values ?? [];
      const map = new Map<string, ErrorLogDetail>();

      // Key each detail by its own message hash id.
      // The backend omits hashes whose document can't be loaded, so a
      // positional/length-based mapping silently drops every column when even
      // one hash is missing.
      details.forEach((detail) => {
        if (detail.id) {
          map.set(detail.id, detail);
        }
      });
      return map;
    })();

    // Evict failed requests so a subsequent render can retry instead of
    // forever returning the cached rejection.
    promise.catch(() => {
      if (inflight.get(cacheKey) === promise) {
        inflight.delete(cacheKey);
      }
    });

    inflight.set(cacheKey, promise);
    return promise;
  };
};

export default createTopErrorLogDetailsFetcher;
