import { useCallback } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';

const useOnSelectChartRegion = (): SelectionCallback<number> => {
  const { onChangeDateRangeParams } = useAnalyticsCurrentDateRangeBundle();

  return useCallback(
    ({ minX, maxX }: { minX: number; maxX: number }) => {
      let min;
      let max;
      try {
        min = new Date(minX);
        max = new Date(maxX);
      } catch {
        // NOTE(gperkins@20241031): highcharts very rarely fails to provide the x-axis (see DSA-3739)
        //  unknown what case causes this; we probably don't need to do anything.
      }

      if (min && max) {
        onChangeDateRangeParams(min, max, RAQIV2DateRangeType.Custom);
      }
    },
    [onChangeDateRangeParams],
  );
};

export default useOnSelectChartRegion;
