import React, { useCallback, useMemo, useState } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterStringChoice from '@modules/charts-generic/components/FilterStringChoice';
import AnalyticsConfigTabbedChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigTabbedChart';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { type EngagementType, buildEngagementTabbedConfig } from './chartConfigs';

const ENGAGEMENT_OPTIONS: EngagementType[] = ['all', 'reactions', 'polls'];

const ENGAGEMENT_LABEL_KEYS: Record<EngagementType, string> = {
  all: 'Label.EngagementAll',
  reactions: 'Label.Reactions',
  polls: 'Label.Polls',
};

const AnnouncementEngagementInner: React.FC<{
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: SelectionCallback<number> | null;
}> = ({ chartContext, onSelectChartRegion }) => {
  const [engagementType, setEngagementType] = useState<EngagementType>('all');
  const { translate } = useRAQIV2TranslationDependencies();

  const tabbedConfig = useMemo(() => buildEngagementTabbedConfig(engagementType), [engagementType]);

  const formatOption = useCallback(
    (option: EngagementType) =>
      translate(translationKey(ENGAGEMENT_LABEL_KEYS[option], TranslationNamespace.Community)),
    [translate],
  );

  const handleChange = useCallback((next: EngagementType[]) => {
    if (next.length > 0) {
      setEngagementType(next[0]);
    }
  }, []);

  const chartControl = useMemo(
    () => (
      <div className='padding-top-small'>
        <FilterStringChoice
          className='min-width-[150px]'
          selectedOptions={[engagementType]}
          options={ENGAGEMENT_OPTIONS}
          formatOption={formatOption}
          onChange={handleChange}
        />
      </div>
    ),
    [engagementType, formatOption, handleChange],
  );

  return (
    <AnalyticsConfigTabbedChart
      tabbedChartKeyOrConfig={tabbedConfig}
      chartContext={chartContext}
      onSelectChartRegion={onSelectChartRegion}
      chartControl={chartControl}
    />
  );
};

export function getAnnouncementEngagementConfig(): ArbitraryComponentConfig {
  return {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [
      RAQIV2Metric.CommunityAnnouncementEventCount,
      RAQIV2Metric.CommunityAnnouncementUniqueUsers,
    ],
    renderer: {
      type: 'withChartContext',
      render: (chartContext, onSelectChartRegion) => (
        <AnnouncementEngagementInner
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      ),
    },
  };
}
