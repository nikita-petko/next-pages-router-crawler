import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { type ChartCardHeaderAction, ChartColor, SankeyChart } from '@rbx/analytics-ui';
import { RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartOverflowMenu, {
  ChartSourceQueryDialog,
  ChartSourceQueryMenuItem,
} from '@modules/experience-analytics-shared/components/ChartOverflowMenu';
import { useRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import { useAnalyticsEnumTabLayoutBundle } from '@modules/experience-analytics-shared/context/AnalyticsTabLayoutBundleProvider';
import useChartOverflowMenu from '@modules/experience-analytics-shared/hooks/useChartOverflowMenu';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import recommendedEventsJourneysFilterDimensions from '../config/recommendedEventsJourneysFilterDimensions';
import { JOURNEY_SANKEY_METRIC_TABS } from '../types';
import { useJourneyTransitions } from '../useJourneyData';
import JourneySankeyCsvExporter from './journeySankeyCsvExporter';

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

  const { isLoading, error, sankeyData, journeyData, refetch } = useJourneyTransitions(
    journeyName,
    journeyVersion,
    raqiFilters,
  );

  const activeSankeyLinks = useMemo(() => {
    if (!journeyData) {
      return undefined;
    }
    return journeyData.edges.map((edge) => ({
      source: `${edge.fromNode}:${edge.fromStage}`,
      target: `${edge.toNode}:${edge.toStage}`,
      value: sankeyMetric === 'sessions' ? edge.transitionCount : edge.userCount,
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

  // Standard chart overflow: "Download CSV" + "View source query", matching the
  // chrome the generic chart cards get.
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

  const downloadCsvLabel = tPendingTranslation(
    'Download CSV',
    'Menu item label to download chart data as a CSV file.',
    translationKey('Action.ExploreMode.DownloadCsv', TranslationNamespace.Analytics),
  );
  const viewSourceQueryLabel = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );

  const overflowActions: ChartCardHeaderAction[] = [
    {
      id: 'download',
      kind: 'button',
      label: downloadCsvLabel,
      onClick: () => csvExporter.download({}),
      disabled: csvExporter.hasEmptyData,
      testId: 'chart-overflow-download-csv',
    },
    {
      id: 'view-source-query',
      kind: 'custom',
      label: viewSourceQueryLabel,
      render: ({ closeMenu } = {}) => (
        <ChartSourceQueryMenuItem
          onClick={() => {
            setSourceQueryOpen(true);
            closeMenu?.();
          }}
        />
      ),
      renderOverlay: () => (
        <ChartSourceQueryDialog
          open={sourceQueryOpen}
          spec={sourceQuerySpec}
          onClose={() => setSourceQueryOpen(false)}
        />
      ),
    },
  ];

  const overflowMenuAction = useChartOverflowMenu({ actions: overflowActions });

  if (!journeyName) {
    return null;
  }

  if (error) {
    return <LoadError onReload={refetch} />;
  }

  return (
    <div className='flex flex-col gap-large padding-large bg-surface-100 stroke-thin stroke-default radius-large [overflow-x:auto]'>
      <div className='flex items-center justify-between'>
        <h2 className='text-title-large content-emphasis margin-none'>{journeyName}</h2>
        {overflowMenuAction?.kind === 'menu' && (
          <ChartOverflowMenu action={overflowMenuAction} actions={overflowActions} />
        )}
      </div>
      {isLoading ? (
        <div className='flex justify-center items-center [min-height:200px]'>
          <ProgressCircle
            variant='Indeterminate'
            ariaLabel={tPendingTranslation(
              'Loading journey data',
              'Aria label for the loading spinner while journey transition data is fetched',
              translationKey('Label.LoadingJourneyData', TranslationNamespace.Analytics),
            )}
          />
        </div>
      ) : sankeyDataProp ? (
        <SankeyChart data={sankeyDataProp} />
      ) : (
        <p className='content-muted'>
          {tPendingTranslation(
            'No data for this selection.',
            'Empty state when no journey data exists for the current filters',
            translationKey('Label.NoJourneyData', TranslationNamespace.Analytics),
          )}
        </p>
      )}
    </div>
  );
};

export default JourneySankeyChart;
