import { DateRangeType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import { SelectionCallback } from '@rbx/analytics-ui';
import { useCallback } from 'react';

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
        onChangeDateRangeParams(min, max, DateRangeType.Custom);
      }
    },
    [onChangeDateRangeParams],
  );
};

export default useOnSelectChartRegion;
