import { useCallback, useLayoutEffect, useRef } from 'react';
import type { Chart, ChartRenderCallbackFunction } from 'highcharts';

const useCombinedChartRenderCallback = (
  firstCallback: ChartRenderCallbackFunction | undefined,
  secondCallback: (() => void) | undefined,
): ChartRenderCallbackFunction | undefined => {
  const secondCallbackRef = useRef(secondCallback);

  useLayoutEffect(() => {
    secondCallbackRef.current = secondCallback;
  }, [secondCallback]);

  const combinedCallback = useCallback(
    function combinedChartRenderCallback(this: Chart, event: Event) {
      firstCallback?.call(this, event);
      secondCallbackRef.current?.();
    },
    [firstCallback],
  );

  return firstCallback !== undefined || secondCallback !== undefined ? combinedCallback : undefined;
};

export default useCombinedChartRenderCallback;
