import type { FunctionComponent } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import {
  CreatorAnalyticsPageMode,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsScoringConfigurationNameCard from '../components/AnalyticsScoringConfigurationNameCard';
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
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last7Days,
    maxStartDateOffsetDays: 365,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions,
  granularity: {
    options: [RAQIV2MetricGranularity.OneHour, RAQIV2MetricGranularity.OneDay],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: [{ type: 'freshness', startWithinDays: 7 }],
    },
  },
  filterDimensions: [
    RAQIV2Dimension.Place,
    RAQIV2UIPseudoDimension.PercentileType,
    RAQIV2Dimension.AgeGroupV2,
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
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions,
  granularity: {
    options: [RAQIV2MetricGranularity.OneHour, RAQIV2MetricGranularity.OneDay],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: [{ type: 'freshness', startWithinDays: 7 }],
    },
  },
  filterDimensions: [
    RAQIV2Dimension.Place,
    RAQIV2UIPseudoDimension.PercentileType,
    RAQIV2Dimension.AgeGroupV2,
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
