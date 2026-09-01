import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { type ChartCardHeaderAction, ChartColor, type SankeyChartData } from '@rbx/analytics-ui';
import { RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  ChartSourceQueryDialog,
  ChartSourceQueryMenuItem,
} from '@modules/experience-analytics-shared/components/ChartOverflowMenu';
import GenericSankeyChart from '@modules/experience-analytics-shared/components/RAQIV2/GenericSankeyChart';
import { useRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import { useAnalyticsEnumTabLayoutBundle } from '@modules/experience-analytics-shared/context/AnalyticsTabLayoutBundleProvider';
import useChartOverflowMenu from '@modules/experience-analytics-shared/hooks/useChartOverflowMenu';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import recommendedEventsJourneysFilterDimensions from '../config/recommendedEventsJourneysFilterDimensions';
import { JOURNEY_SANKEY_METRIC_TABS } from '../types';
import { useJourneyTransitions } from '../useJourneyData';
import JourneySankeyCsvExporter from './journeySankeyCsvExporter';

const EMPTY_SANKEY_DATA: SankeyChartData = { nodes: [], links: [] };

/** Funnels get a taller canvas than the standard card so stages stay readable. */
const JOURNEY_CHART_HEIGHT = 444;

/**
 * Muted categorical palette so the Sankey link gradients read as soft flows
 * rather than fully-saturated bands. Cycled by stage (node column) so each
 * stage column gets a consistent hue and adjacent stages blend gently.
 */
const DIMMED_NODE_COLORS = [
  ChartColor.Blue2,
  ChartColor.Green2,
  ChartColor.Purple2,
  ChartColor.Yellow2,
  ChartColor.Cyan2,
  ChartColor.Orange,
  ChartColor.Blue3,
  ChartColor.Green3,
  ChartColor.Purple4,
  ChartColor.Yellow3,
];

const JourneySankeyChart: FC<{ chartContext: RAQIV2ChartContext }> = ({ chartContext }) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const { tabKey: sankeyMetric } = useAnalyticsEnumTabLayoutBundle(JOURNEY_SANKEY_METRIC_TABS);
  const { raqiFilters } = useRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsJourneysFilterDimensions,
  );
  const [sourceQueryOpen, setSourceQueryOpen] = useState(false);

  const journeyName =
    chartContext.filter?.find((f) => f.dimension === RAQIV2Dimension.JourneyName)?.values[0] ?? '';
  const journeyVersion =
    chartContext.filter?.find((f) => f.dimension === RAQIV2Dimension.JourneyVersion)?.values[0] ??
    null;

  const { isLoading, error, sankeyData, journeyData } = useJourneyTransitions(
    journeyName,
    journeyVersion,
    raqiFilters,
  );

  const activeSankeyLinks = useMemo(() => {
    if (!journeyData) {
      return undefined;
    }
    return journeyData.edges.map((edge) => ({
      from: `${edge.fromNode}:${edge.fromStage}`,
      to: `${edge.toNode}:${edge.toStage}`,
      weight: sankeyMetric === 'sessions' ? edge.transitionCount : edge.userCount,
    }));
  }, [journeyData, sankeyMetric]);

  // Stabilize the node reference so React Query background refetches that return
  // identical data don't bypass SankeyChart's React.memo and trigger spurious
  // chart.update() redraws. Assign a muted color per stage so the gradients
  // between stages read as soft flows.
  const sankeyNodes = useMemo(
    () =>
      sankeyData?.nodes.map((node) => ({
        ...node,
        color: DIMMED_NODE_COLORS[(node.column ?? 0) % DIMMED_NODE_COLORS.length],
      })),
    [sankeyData],
  );

  const sankeyDataProp = useMemo(
    () =>
      sankeyNodes && activeSankeyLinks
        ? { nodes: sankeyNodes, links: activeSankeyLinks }
        : undefined,
    [sankeyNodes, activeSankeyLinks],
  );

  const activeMetric =
    sankeyMetric === 'sessions'
      ? RAQIV2Metric.JourneyTransitionCount
      : RAQIV2Metric.JourneyTransitionCountUser;

  const csvExporter = useMemo(
    () => new JourneySankeyCsvExporter(journeyData, journeyName, translate),
    [journeyData, journeyName, translate],
  );

  const sourceQuerySpec = useMemo<RAQIV2ChartSpec>(
    () => ({
      ...chartContext,
      metric: activeMetric,
    }),
    [chartContext, activeMetric],
  );

  const viewSourceQueryLabel = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );

  const handleOpenSourceQuery = useCallback(() => {
    setSourceQueryOpen(true);
  }, []);
  const handleCloseSourceQuery = useCallback(() => {
    setSourceQueryOpen(false);
  }, []);

  const sourceQueryAction: ChartCardHeaderAction = useMemo(
    () => ({
      id: 'view-source-query',
      kind: 'custom',
      label: viewSourceQueryLabel,
      render: ({ closeMenu } = {}) => (
        <ChartSourceQueryMenuItem
          onClick={() => {
            handleOpenSourceQuery();
            closeMenu?.();
          }}
        />
      ),
      renderOverlay: () => (
        <ChartSourceQueryDialog
          open={sourceQueryOpen}
          spec={sourceQuerySpec}
          onClose={handleCloseSourceQuery}
        />
      ),
    }),
    [
      handleCloseSourceQuery,
      handleOpenSourceQuery,
      sourceQueryOpen,
      sourceQuerySpec,
      viewSourceQueryLabel,
    ],
  );

  const sourceQueryActions = useMemo(() => [sourceQueryAction], [sourceQueryAction]);
  const overflowMenuAction = useChartOverflowMenu({ actions: sourceQueryActions });
  const headerActionItems = useMemo(
    () => (overflowMenuAction ? [overflowMenuAction] : undefined),
    [overflowMenuAction],
  );

  const requestStatus = useMemo(
    () => ({
      isDataLoading: isLoading,
      isResponseFailed: !!error,
      isUserForbidden: false,
      error: error instanceof Error ? error : undefined,
    }),
    [error, isLoading],
  );

  if (!journeyName) {
    return null;
  }

  return (
    <GenericSankeyChart
      titleLabel={journeyName}
      data={sankeyDataProp ?? EMPTY_SANKEY_DATA}
      requestStatus={requestStatus}
      chartHeight={JOURNEY_CHART_HEIGHT}
      exportFileName={journeyName}
      exporter={csvExporter}
      headerActionItems={headerActionItems}
    />
  );
};

export default JourneySankeyChart;
