import React, { Fragment, FunctionComponent, useMemo } from 'react';
import {
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  getCreatorAnalyticsPageLayout,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { useAffiliateProgram } from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import { DateRangeType } from '@modules/charts-generic';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  tabbedTableConfigCreatorRewardsShareLinks,
  tabbedTableConfigCreatorRewardsShareLinksStarCode,
} from './tableConfigs';
import {
  chartConfigAffiliateLinkCreatorRewardsEarned,
  chartConfigClicks,
  chartConfigDailyRewardedActiveSpenders,
  chartConfigRewardedReactivations,
  chartConfigRewardedSignups,
  chartConfigUniqueClicks,
} from './chartConfigs';

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
            DateRangeType.Last7Days,
            DateRangeType.Last28Days,
            DateRangeType.Last90Days,
            DateRangeType.Custom,
          ],
          defaultRange: DateRangeType.Last28Days,
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
            DateRangeType.Last7Days,
            DateRangeType.Last28Days,
            DateRangeType.Last90Days,
            DateRangeType.Custom,
          ],
          defaultRange: DateRangeType.Last28Days,
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
    <Fragment>
      <CreatorAnalyticsLayout config={creatorRewardsShareLinksDailyChartsSurfaceConfig} />
      <CreatorAnalyticsLayout config={creatorRewardsShareLinksTableSurfaceConfig} />
    </Fragment>,
  );
};

export default CreatorRewardsShareLinksAnalytics;
