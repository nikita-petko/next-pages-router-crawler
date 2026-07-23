import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  AnalyticsComponentType,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  GranularityConstraint,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';
import { DateRangeType } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useCreationsCustomSettings } from '@modules/creations';
import {
  chartConfigMatchmakingCategoricalCustomSignalsSimilarityRatio,
  chartConfigMatchmakingNumericCustomSignalsDifference,
  chartConfigMatchmakingPlayerAttributesLoadingStatusAvg,
  chartConfigMatchmakingSignalsAgeDifference,
  chartConfigMatchmakingSignalsCommonDeviceTypeRatio,
  chartConfigMatchmakingSignalsCommonLanguageRatio,
  chartConfigMatchmakingSignalsEstimatePing,
  chartConfigMatchmakingSignalsOccupancyRatio,
  chartConfigMatchmakingSignalsPlayHistoryDifference,
  chartConfigMatchmakingSignalsPreferredPlayerMatchRatioAvg,
  chartConfigMatchmakingSignalsCommonChatGroupRatio,
  chartConfigMatchmakingSignalsVoiceChatRatio,
} from './matchmakingAnalyticsConfigs';
import AnalyticsScoringConfigurationNameCard from '../components/AnalyticsScoringConfigurationNameCard';

const surfaceAnnotationOptions = {
  supportedAnnotationTypes: [AnnotationType.CustomMatchmaking, AnnotationType.Announcement],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;

const matchmakingAnalyticsConfig: CreatorAnalyticsEmbeddedSurfaceConfig = {
  debugPageName: 'Matchmaking',
  mode: CreatorAnalyticsPageMode.Embedded,
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last7Days,
    maxStartDateOffsetDays: 365,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions,
  granularity: {
    options: [RAQIV2MetricGranularity.OneHour, RAQIV2MetricGranularity.OneDay],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: GranularityConstraint.MOST_RECENT_SEVEN_DAYS,
    },
  },
  filterDimensions: [
    RAQIV2Dimension.Place,
    RAQIV2UIPseudoDimension.PercentileType,
    RAQIV2Dimension.AgeGroup,
    RAQIV2Dimension.Country,
  ],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.NonGeneric,
          metrics: [],
          renderer: {
            type: 'isolated',
            render: () => {
              return (
                <div>
                  <AnalyticsScoringConfigurationNameCard />
                </div>
              );
            },
          },
        },
      ],
    },
    chartConfigMatchmakingSignalsOccupancyRatio,
    chartConfigMatchmakingSignalsAgeDifference,
    chartConfigMatchmakingSignalsCommonLanguageRatio,
    chartConfigMatchmakingSignalsPreferredPlayerMatchRatioAvg,
    chartConfigMatchmakingSignalsEstimatePing,
    chartConfigMatchmakingSignalsPlayHistoryDifference,
    chartConfigMatchmakingSignalsCommonDeviceTypeRatio,
    chartConfigMatchmakingSignalsVoiceChatRatio,
    chartConfigMatchmakingNumericCustomSignalsDifference,
    chartConfigMatchmakingCategoricalCustomSignalsSimilarityRatio,
    chartConfigMatchmakingPlayerAttributesLoadingStatusAvg,
  ],
};
const matchmakingAnalyticsConfigWithTextChat: CreatorAnalyticsEmbeddedSurfaceConfig = {
  mode: CreatorAnalyticsPageMode.Embedded,
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions,
  granularity: {
    options: [RAQIV2MetricGranularity.OneHour, RAQIV2MetricGranularity.OneDay],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: GranularityConstraint.MOST_RECENT_SEVEN_DAYS,
    },
  },
  filterDimensions: [
    RAQIV2Dimension.Place,
    RAQIV2UIPseudoDimension.PercentileType,
    RAQIV2Dimension.AgeGroup,
    RAQIV2Dimension.Country,
    // TODO(yqiu): Support more filters like country.
  ],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.NonGeneric,
          metrics: [],
          renderer: {
            type: 'isolated',
            render: () => {
              return (
                <div>
                  <AnalyticsScoringConfigurationNameCard />
                </div>
              );
            },
          },
        },
      ],
    },
    chartConfigMatchmakingSignalsOccupancyRatio,
    chartConfigMatchmakingSignalsAgeDifference,
    chartConfigMatchmakingSignalsCommonLanguageRatio,
    chartConfigMatchmakingSignalsPreferredPlayerMatchRatioAvg,
    chartConfigMatchmakingSignalsEstimatePing,
    chartConfigMatchmakingSignalsPlayHistoryDifference,
    chartConfigMatchmakingSignalsCommonDeviceTypeRatio,
    chartConfigMatchmakingSignalsCommonChatGroupRatio,
    chartConfigMatchmakingSignalsVoiceChatRatio,
    chartConfigMatchmakingNumericCustomSignalsDifference,
    chartConfigMatchmakingCategoricalCustomSignalsSimilarityRatio,
    chartConfigMatchmakingPlayerAttributesLoadingStatusAvg,
  ],
};

const MatchmakingAnalyticsContainer: FunctionComponent = () => {
  const { isCustomMatchmakingTextChatSignalEnabled } = useCreationsCustomSettings();
  if (isCustomMatchmakingTextChatSignalEnabled) {
    return <CreatorAnalyticsLayout config={matchmakingAnalyticsConfigWithTextChat} />;
  }
  return <CreatorAnalyticsLayout config={matchmakingAnalyticsConfig} />;
};

export default withTranslation(MatchmakingAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Matchmaking,
  TranslationNamespace.Navigation,
]);
