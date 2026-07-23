import { useCallback, useEffect, useMemo, useState } from 'react';
import { RAQIV2Dimension, RAQIV2Universe } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { RAQIV2TableRowID } from '../adapters/genericRAQIV2TableAdapter';
import type { RowDataResponse } from '../components/RAQIV2/table/GenericDataTable';
import { useUniverseNameMapFromContext } from '../context/UniverseNameMapProvider';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';

export const getUniverseIdFromBreakdownValue = (
  breakdownValue: RAQIV2BreakdownValue,
): number | null => {
  const { dimension, value } = breakdownValue;
  if (dimension === RAQIV2Dimension.Universe && value !== RAQIV2Universe.Website) {
    const id = Number(value);
    if (id > 0) {
      return id;
    }
  }
  return null;
};

const getUniverseBreakdownIds = (data: RAQIV2QueryResponses | null): number[] => {
  const results = new Set<number>();
  data?.response?.values?.forEach((series) => {
    series.breakdownValue?.forEach((breakdownValue) => {
      const id = getUniverseIdFromBreakdownValue(breakdownValue);
      if (id) {
        results.add(id);
      }
    });
  });
  return Array.from(results);
};

const useLoadUniverseIdsForData = (raqiData: RAQIV2QueryResponses | null) => {
  const { addUniverseIds } = useUniverseNameMapFromContext();
  const universeIds = useMemo(() => {
    return getUniverseBreakdownIds(raqiData);
  }, [raqiData]);

  useEffect(() => {
    if (universeIds.length > 0) {
      addUniverseIds(universeIds);
    }
  }, [addUniverseIds, universeIds]);
};

export const useLoadUniverseIds = () => {
  const { addUniverseIds } = useUniverseNameMapFromContext();
  const [universeIds, setUniverseIds] = useState<number[]>([]);

  const getNewUniverseIdsFromBreakdownValues = useCallback(
    (values?: Array<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>> | null) => {
      if (!values) {
        return;
      }
      const ids: number[] = [];
      values.forEach(({ rowData }) => {
        rowData.forEach((breakdownValue) => {
          const id = getUniverseIdFromBreakdownValue(breakdownValue);
          if (id) {
            ids.push(id);
          }
        });
      });
      const newUniverseIds = ids.filter((id) => !universeIds.includes(id));
      if (newUniverseIds.length > 0) {
        setUniverseIds((prev) => [...prev, ...newUniverseIds]);
      }
    },
    [setUniverseIds, universeIds],
  );

  useEffect(() => {
    if (universeIds.length > 0) {
      addUniverseIds(universeIds);
    }
  }, [addUniverseIds, universeIds]);

  return getNewUniverseIdsFromBreakdownValues;
};

export default useLoadUniverseIdsForData;
