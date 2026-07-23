import { ChartSelectionCallbackFunction } from 'highcharts';
import { useCallback } from 'react';

export type SelectionCallback<X> = ({ minX, maxX }: { minX: X; maxX: X }) => void;

const useOnSelectChartRegion = <X>(
  selectionCallback?: SelectionCallback<X>,
): ChartSelectionCallbackFunction | undefined => {
  const onSelectChartRegion: ChartSelectionCallbackFunction = useCallback(
    (ev) => {
      let min;
      let max;
      try {
        min = ev.xAxis[0].min;
        max = ev.xAxis[0].max;
      } catch {
        // NOTE(gperkins@20241031): highcharts sometimes (very rarely) fails to provide the x-axis (see DSA-3739)
        // unknown what case causes this; we probably don't need to do anything.
      }

      if (min !== undefined && max !== undefined) {
        selectionCallback?.({ minX: min as X, maxX: max as X });
      }
      // NOTE(shumingxu, 02/07/2024): Return false to prevent default highcharts event
      // See https://api.highcharts.com/highcharts/chart.events.selection
      return false;
    },
    [selectionCallback],
  );
  return selectionCallback ? onSelectChartRegion : undefined;
};

export default useOnSelectChartRegion;
