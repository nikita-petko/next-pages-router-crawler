import type { ReactNode } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import { useChartActionsPolicy } from './ChartActionsContext';
import {
  type ChartHeaderActionLayout,
  useDefaultChartHeaderActions,
} from './composeChartHeaderActions';

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

/**
 * Resolves chart header action items from `ChartActionsProvider` policy, then
 * falls back to RAQI defaults when the policy does not replace them.
 */
export default function ChartActionsSlot({ children, ...options }: ChartActionsSlotProps) {
  const policy = useChartActionsPolicy();

  if (policy === false) {
    return children({ headerActionItems: [] });
  }

  if (policy?.actions) {
    return children({ headerActionItems: policy.actions });
  }

  return <DefaultChartActionsSlot {...options}>{children}</DefaultChartActionsSlot>;
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
}: ChartActionsSlotProps) {
  const defaults = useDefaultChartHeaderActions({
    chartKeyOrConfig,
    spec,
    kpiType,
    exporter,
    chartLocation,
    visibleTimeSeriesAnnotations,
    actionLayout,
    disabled: downloadDisabled,
  });

  return children({ headerActionItems: defaults });
}
