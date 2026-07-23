import { useCallback } from 'react';
import type {
  ChartConfiguratorGranularityControlsProps,
  ChartConfiguratorMetricControlsProps,
  ChartConfiguratorSidebarAction,
  ChartConfiguratorSidebarDispatch,
  ChartConfiguratorTableControlsProps,
} from './ChartConfiguratorSidebarModelTypes';

const isDev = process.env.NODE_ENV !== 'production';
const ENABLE_ACTION_INVARIANT_DIAGNOSTICS = false;
const ACTION_TRACE_STORAGE_KEY = 'chartConfiguratorTraceActions';

type SidebarInvariantSnapshot = {
  metricControls: ChartConfiguratorMetricControlsProps;
  granularityControls: ChartConfiguratorGranularityControlsProps;
  tableControls: ChartConfiguratorTableControlsProps;
};

function warnInvariant(message: string, action: ChartConfiguratorSidebarAction) {
  // Dev-only action diagnostics should never affect user-facing behavior.
  console.warn(`[ChartConfiguratorSidebar] ${message}`, { action });
}

function assertSidebarInvariants(
  action: ChartConfiguratorSidebarAction,
  { metricControls, granularityControls, tableControls }: SidebarInvariantSnapshot,
) {
  if (
    metricControls.mode === 'operations' &&
    metricControls.metric &&
    !metricControls.computedMetric
  ) {
    warnInvariant('Operations mode is active without a computed metric draft.', action);
  }

  if (action.type === 'set-custom-event-filters' && metricControls.mode !== 'custom-events') {
    warnInvariant('Custom event filters changed outside custom-events mode.', action);
  }

  if (action.type === 'set-table-additional-columns' && tableControls.mode !== 'table') {
    warnInvariant('Table additional columns changed outside table mode.', action);
  }

  if (
    tableControls.mode === 'chart' &&
    (granularityControls.chartContext.breakdown?.length ?? 0) > 1
  ) {
    warnInvariant('Non-table mode is carrying a multi-dimension breakdown.', action);
  }
}

function traceSidebarAction(action: ChartConfiguratorSidebarAction) {
  const shouldTrace =
    typeof window !== 'undefined' && window.localStorage.getItem(ACTION_TRACE_STORAGE_KEY) === '1';
  if (shouldTrace) {
    console.warn(`[ChartConfiguratorSidebar] ${action.type}`, action);
  }
}

export default function useTracedChartConfiguratorSidebarDispatch(
  dispatch: ChartConfiguratorSidebarDispatch,
  snapshot: SidebarInvariantSnapshot,
): ChartConfiguratorSidebarDispatch {
  return useCallback(
    (action) => {
      if (isDev) {
        traceSidebarAction(action);
        if (ENABLE_ACTION_INVARIANT_DIAGNOSTICS) {
          assertSidebarInvariants(action, snapshot);
        }
      }
      dispatch(action);
    },
    [dispatch, snapshot],
  );
}
