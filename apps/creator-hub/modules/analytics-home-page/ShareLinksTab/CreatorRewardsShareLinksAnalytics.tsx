import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useAffiliateProgram } from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import type { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import getCreatorAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getCreatorAnalyticsPageLayout';
import type {
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import {
  chartConfigAffiliateLinkCreatorRewardsEarned,
  chartConfigClicks,
  chartConfigDailyRewardedActiveSpenders,
  chartConfigRewardedReactivations,
  chartConfigRewardedSignups,
  chartConfigUniqueClicks,
} from './chartConfigs';
import {
  tabbedTableConfigCreatorRewardsShareLinks,
  tabbedTableConfigCreatorRewardsShareLinksStarCode,
} from './tableConfigs';

const surfaceAnnotationOptions = {
  supportedAnnotationTypes: [] as AnnotationType[],
  defaultAnnotationTypes: [] as AnnotationType[],
  showAnnotationsControl: false,
};

const CreatorRewardsShareLinksAnalytics: FunctionComponent = () => {
  const { creatorMetadata } = useAffiliateProgram();

  const hasStarCode = useMemo(
    () => creatorMetadata?.isAllowedToCreateForAnyExperience,
    [creatorMetadata],
  );

  const tableToDisplay = useMemo(() => {
    return hasStarCode
      ? tabbedTableConfigCreatorRewardsShareLinksStarCode
      : tabbedTableConfigCreatorRewardsShareLinks;
  }, [hasStarCode]);

  const creatorRewardsShareLinksDailyChartsSurfaceConfig: CreatorAnalyticsEmbeddedSurfaceConfig =
    useMemo(() => {
      return {
        mode: CreatorAnalyticsPageMode.Embedded,
        resourceTypes: [RAQIV2ChartResourceType.User],
        granularity: {
          options: [
            RAQIV2MetricGranularity.OneDay,
            RAQIV2MetricGranularity.OneWeek,
            RAQIV2MetricGranularity.OneMonth,
          ],
        },
        breakdownDimensions: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
        filterDimensions: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Last90Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last28Days,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions,
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [chartConfigAffiliateLinkCreatorRewardsEarned],
          },
          chartConfigClicks,
          chartConfigUniqueClicks,
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: hasStarCode ? [chartConfigDailyRewardedActiveSpenders] : [],
          },
          chartConfigRewardedSignups,
          chartConfigRewardedReactivations,
        ],
      };
    }, [hasStarCode]);

  const creatorRewardsShareLinksTableSurfaceConfig: CreatorAnalyticsEmbeddedSurfaceConfig =
    useMemo(() => {
      return {
        mode: CreatorAnalyticsPageMode.Embedded,
        resourceTypes: [RAQIV2ChartResourceType.User],
        granularity: {
          options: [
            RAQIV2MetricGranularity.OneDay,
            RAQIV2MetricGranularity.OneWeek,
            RAQIV2MetricGranularity.OneMonth,
          ],
        },
        breakdownDimensions: [],
        filterDimensions: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Last90Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last28Days,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions,
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [tableToDisplay],
          },
        ],
      };
    }, [tableToDisplay]);

  // Two layouts: charts use daily granularity; table uses aggregated metrics with different date range options.
  return getCreatorAnalyticsPageLayout(
    <>
      <CreatorAnalyticsLayout config={creatorRewardsShareLinksDailyChartsSurfaceConfig} />
      <CreatorAnalyticsLayout config={creatorRewardsShareLinksTableSurfaceConfig} />
    </>,
  );
};

export default CreatorRewardsShareLinksAnalytics;
