import type { PlaySessionQueryOptions } from '@modules/clients/analytics/universeSessionMetadataApi';
import type { SessionBrowserFilters } from '../types/SessionBrowserFilters';
import { getDateRangeBounds } from './filterUtils';

export const toPlaySessionQueryOptions = (
  filters: SessionBrowserFilters,
): PlaySessionQueryOptions => {
  const dateRange = getDateRangeBounds(filters.dateRange);
  if (!dateRange) {
    return {};
  }

  // Date objects are absolute instants. The generated metadata client serializes
  // these bounds as UTC for the play-session query endpoint.
  return {
    startTime: dateRange.min,
    endTime: dateRange.max,
  };
};
