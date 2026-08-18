import { useCallback, useInsertionEffect, useRef } from 'react';
import type { ChartLoadTelemetryBundle, ChartRenderStatus } from './useChartLoadTelemetry';

type SuccessfulChartRenderStatus = Required<
  Pick<ChartRenderStatus, 'hasNoData' | 'isClassificationReady'>
> &
  Omit<ChartRenderStatus, 'hasNoData' | 'isClassificationReady'>;

const useSuccessfulChartRenderCallback = (
  telemetryBundle: ChartLoadTelemetryBundle,
  status: SuccessfulChartRenderStatus,
  target?: string,
): (() => void) => {
  const statusRef = useRef(status);

  // Highcharts can render from a descendant layout effect, so refresh the status first.
  useInsertionEffect(() => {
    statusRef.current = status;
  }, [status]);

  return useCallback(() => {
    telemetryBundle.completeChartRender(statusRef.current, target);
  }, [target, telemetryBundle]);
};

export default useSuccessfulChartRenderCallback;
