import { useCallback } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';

const useOnSelectChartRegion = (): SelectionCallback<number> => {
  const { onChangeDateRangeParams } = useAnalyticsCurrentDateRangeBundle();

  return useCallback(
    ({ minX, maxX }: { minX: number; maxX: number }) => {
      const min = new Date(minX);
      const max = new Date(maxX);

      if (Number.isFinite(min.getTime()) && Number.isFinite(max.getTime())) {
        onChangeDateRangeParams(min, max, RAQIV2DateRangeType.Custom);
      }
    },
    [onChangeDateRangeParams],
  );
};

export default useOnSelectChartRegion;
