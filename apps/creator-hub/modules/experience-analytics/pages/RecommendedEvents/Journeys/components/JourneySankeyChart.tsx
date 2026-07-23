import type { FC } from 'react';
import { useMemo } from 'react';
import { SankeyChart } from '@rbx/analytics-ui';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import { useAnalyticsEnumTabLayoutBundle } from '@modules/experience-analytics-shared/context/AnalyticsTabLayoutBundleProvider';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import recommendedEventsJourneysFilterDimensions from '../config/recommendedEventsJourneysFilterDimensions';
import { JOURNEY_SANKEY_METRIC_TABS } from '../types';
import { useJourneyTransitions } from '../useJourneyData';

const JourneySankeyChart: FC<{ chartContext: RAQIV2ChartContext }> = ({ chartContext }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { tabKey: sankeyMetric } = useAnalyticsEnumTabLayoutBundle(JOURNEY_SANKEY_METRIC_TABS);
  const { raqiFilters } = useRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsJourneysFilterDimensions,
  );

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

  if (!journeyName) {
    return null;
  }

  if (error) {
    return <LoadError onReload={refetch} />;
  }

  return (
    <div className='flex flex-col gap-large padding-large bg-surface-100 stroke-thin stroke-default radius-large [overflow-x:auto]'>
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
      ) : sankeyData && activeSankeyLinks ? (
        <SankeyChart nodes={sankeyData.nodes} links={activeSankeyLinks} />
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
