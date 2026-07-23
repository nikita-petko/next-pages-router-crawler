import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import React, { FC, useMemo } from 'react';
import { Flex } from '@modules/miscellaneous/common/components';
import { Chip, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
} from '@modules/experience-analytics-shared';
import { ChartResourceType, DateRangeType } from '@modules/charts-generic';
import { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useCreationsCustomSettings } from '@modules/creations';
import { AnalyticsViewType, analyticsViewItems } from '../utils';
import useAdsAnalyticsStyles from '../AdsAnalytics.styles';
import {
  analyticsViewTypeToPageLayoutMap,
  rewardedVideoPageLayout,
  viewTypeDefaultBreakdownDimension,
  viewTypeSpecificBreakdownDimensions,
  viewTypeSpecificFilters,
} from '../pageLayouts';

const filterDimensions = [
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Platform,
];

const breakdownDimensions = [
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Platform,
];

const immersiveAdsTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    DateRangeType.Last7Days,
    DateRangeType.Last28Days,
    DateRangeType.Last90Days,
    DateRangeType.Last365Days,
    DateRangeType.Custom,
  ],
  defaultRange: DateRangeType.Last28Days,
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxStartDateOffsetDays: 365,
} as const satisfies AnalyticsPageConfigDateOptions;

const immersiveAdsSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.LiveEvent,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
interface AnalyticsPageContentV2Props {
  analyticsViewType: AnalyticsViewType;
  setAnalyticsViewType: (analyticsViewType: AnalyticsViewType) => void;
}

const AnalyticsPageContentV2: FC<AnalyticsPageContentV2Props> = ({
  analyticsViewType,
  setAnalyticsViewType,
}) => {
  const { classes } = useAdsAnalyticsStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const { isEdauBreakdownEnabled } = useCreationsCustomSettings();

  // Get the appropriate page layout based on view type and feature flags
  // TODO: After full rollout, remove isEdauBreakdownEnabled flag and use breakdown configs directly.
  // https://roblox.atlassian.net/browse/ADS-10360
  const getPageLayout = useMemo(() => {
    if (analyticsViewType === AnalyticsViewType.RewardedAds) {
      // Use dynamic layout for RewardedAds to support breakdown metrics
      return rewardedVideoPageLayout(isEdauBreakdownEnabled);
    }
    return analyticsViewTypeToPageLayoutMap[analyticsViewType] || [];
  }, [analyticsViewType, isEdauBreakdownEnabled]);

  const analyticsPageConfig: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Embedded,
      resourceTypes: [ChartResourceType.Universe],
      timeRangeOptions: immersiveAdsTimeRangeOptions,
      surfaceAnnotationOptions: immersiveAdsSurfaceAnnotationOptions,
      filterDimensions: [...filterDimensions, ...viewTypeSpecificFilters[analyticsViewType]],
      defaultFilters: [],
      breakdownDimensions: [
        ...breakdownDimensions,
        ...viewTypeSpecificBreakdownDimensions[analyticsViewType],
      ],
      defaultBreakdown: viewTypeDefaultBreakdownDimension[analyticsViewType],
      body: getPageLayout,
    }),
    [analyticsViewType, getPageLayout],
  );

  return (
    <div>
      <Flex classes={{ root: classes.subMenu }}>
        <Flex classes={{ root: classes.subMenuChips }}>
          {analyticsViewItems?.map((analyticsViewItem) => (
            <Chip
              key={analyticsViewItem.type}
              label={translate(analyticsViewItem.nameKey)}
              clickable
              color={analyticsViewType === analyticsViewItem.type ? 'primary' : 'secondary'}
              onClick={() => setAnalyticsViewType(analyticsViewItem.type)}
              role='tab'
            />
          ))}
        </Flex>
        <Typography variant='h6' color='primary'>
          {translate(
            translationKey('Description.DataDelay', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </Typography>
      </Flex>

      <CreatorAnalyticsLayout config={analyticsPageConfig} />
    </div>
  );
};

export default AnalyticsPageContentV2;
