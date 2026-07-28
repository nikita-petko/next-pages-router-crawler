import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { RAQIV2TableRowID } from '../adapters/genericRAQIV2TableAdapter';
import type { RowDataResponse } from '../components/RAQIV2/table/GenericDataTable';
import { useAnnouncementNameMapFromContext } from '../context/AnnouncementNameMapProvider';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';

export const getAnnouncementIdFromBreakdownValue = (
  breakdownValue: RAQIV2BreakdownValue,
): string | null => {
  const { dimension, value } = breakdownValue;
  if (dimension === RAQIV2Dimension.AnnouncementId && value && value.length > 0) {
    return value;
  }
  return null;
};

export const getAnnouncementBreakdownIds = (data: RAQIV2QueryResponses | null): string[] => {
  const results = new Set<string>();
  data?.response?.values?.forEach((series) => {
    series.breakdownValue?.forEach((breakdownValue) => {
      const id = getAnnouncementIdFromBreakdownValue(breakdownValue);
      if (id) {
        results.add(id);
      }
    });
  });
  return Array.from(results);
};

const useLoadAnnouncementIdsForData = (raqiData: RAQIV2QueryResponses | null) => {
  const { addAnnouncementIds } = useAnnouncementNameMapFromContext();
  const announcementIds = useMemo(() => {
    return getAnnouncementBreakdownIds(raqiData);
  }, [raqiData]);

  useEffect(() => {
    if (announcementIds.length > 0) {
      addAnnouncementIds(announcementIds);
    }
  }, [addAnnouncementIds, announcementIds]);
};

export const useLoadAnnouncementIds = () => {
  const { addAnnouncementIds } = useAnnouncementNameMapFromContext();
  const seenIdsRef = useRef<Set<string>>(new Set());

  const getNewAnnouncementIdsFromBreakdownValues = useCallback(
    (values?: Array<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>> | null) => {
      if (!values) {
        return;
      }
      const ids: string[] = [];
      values.forEach(({ rowData }) => {
        rowData.forEach((breakdownValue) => {
          const id = getAnnouncementIdFromBreakdownValue(breakdownValue);
          if (id) {
            ids.push(id);
          }
        });
      });
      if (ids.length === 0) {
        return;
      }
      const unseen = ids.filter((id) => !seenIdsRef.current.has(id));
      if (unseen.length === 0) {
        return;
      }
      unseen.forEach((id) => seenIdsRef.current.add(id));
      addAnnouncementIds(unseen);
    },
    [addAnnouncementIds],
  );

  return getNewAnnouncementIdsFromBreakdownValues;
};

export default useLoadAnnouncementIdsForData;
