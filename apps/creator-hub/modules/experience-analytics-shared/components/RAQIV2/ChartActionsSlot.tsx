import { type ReactNode, useMemo } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import {
  getChartConfigFromPredefinedChart,
  type ChartConfigOrPredefinedKey,
} from '../../constants/RAQIV2PredefinedChartConfig';
import useChartOverflowMenu from '../../hooks/useChartOverflowMenu';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import { useAddChartToDashboardAction } from './AddChartToDashboardAction';
import {
  type ChartActionsCompositionPolicy,
  type ChartHeaderActionLayout,
  useChartActionsPolicy,
} from './ChartActionsContext';
import { useDefaultChartHeaderActions } from './composeChartHeaderActions';

export type ResolvedChartHeaderActions = {
  readonly headerActionItems: readonly ChartCardHeaderAction[];
};

type ChartHeaderActionsOptions = {
  readonly chartKeyOrConfig: ChartConfigOrPredefinedKey | null;
  readonly spec: RAQIV2ChartSpec;
  readonly kpiType: string;
  readonly exporter: GenericCsvExporter;
  readonly chartLocation?: ChartLocation;
  readonly visibleTimeSeriesAnnotations?: readonly TimeSeriesAnnotation[];
  readonly actionLayout?: ChartHeaderActionLayout;
  readonly downloadDisabled?: boolean;
};

type ChartActionsSlotProps = ChartHeaderActionsOptions & {
  readonly children: (actions: ResolvedChartHeaderActions) => ReactNode;
};

type DefaultChartActionsSlotProps = ChartActionsSlotProps & {
  readonly compositionPolicy?: ChartActionsCompositionPolicy;
};

/**
 * Resolves chart header action items from `ChartActionsProvider` policy, then
 * composes or falls back to RAQI defaults when the policy does not replace them.
 */
export default function ChartActionsSlot({ children, ...options }: ChartActionsSlotProps) {
  const policy = useChartActionsPolicy();

  if (policy === false) {
    return children({ headerActionItems: [] });
  }

  if (policy && 'actions' in policy) {
    return children({ headerActionItems: policy.actions });
  }

  return (
    <DefaultChartActionsSlot
      {...options}
      compositionPolicy={policy && 'strategy' in policy ? policy : undefined}>
      {children}
    </DefaultChartActionsSlot>
  );
}

function DefaultChartActionsSlot({
  children,
  chartKeyOrConfig,
  spec,
  kpiType,
  exporter,
  chartLocation,
  visibleTimeSeriesAnnotations,
  actionLayout,
  downloadDisabled,
  compositionPolicy,
}: DefaultChartActionsSlotProps) {
  const defaults = useDefaultChartHeaderActions({
    chartKeyOrConfig,
    spec,
    kpiType,
    exporter,
    chartLocation,
    visibleTimeSeriesAnnotations,
    actionLayout: {
      ...actionLayout,
      ...compositionPolicy?.overrides,
    },
    primaryActions: compositionPolicy?.primaryActions,
    secondaryActions: compositionPolicy?.secondaryActions,
    disabled: downloadDisabled,
  });

  const chartConfig = useMemo(
    () => (chartKeyOrConfig ? getChartConfigFromPredefinedChart(chartKeyOrConfig) : null),
    [chartKeyOrConfig],
  );
  const addToDashboardAction = useAddChartToDashboardAction({ config: chartConfig, spec });
  const standaloneOverflowAction = useChartOverflowMenu({
    actions: addToDashboardAction ? [addToDashboardAction] : [],
    chartLocation,
  });
  const actions = useMemo(() => {
    if (!addToDashboardAction) {
      return defaults;
    }
    const overflowMenuIndex = defaults.findIndex((action) => action.kind === 'menu');
    if (overflowMenuIndex < 0) {
      return standaloneOverflowAction ? [...defaults, standaloneOverflowAction] : defaults;
    }
    const overflowMenu = defaults[overflowMenuIndex];
    if (!overflowMenu || overflowMenu.kind !== 'menu') {
      return defaults;
    }
    return [
      ...defaults.slice(0, overflowMenuIndex),
      { ...overflowMenu, items: [...overflowMenu.items, addToDashboardAction] },
      ...defaults.slice(overflowMenuIndex + 1),
    ];
  }, [addToDashboardAction, defaults, standaloneOverflowAction]);

  return children({ headerActionItems: actions });
}
