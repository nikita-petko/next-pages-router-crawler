import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Chip, Typography } from '@rbx/ui';
import { isRewardedVideoRedesignEnabled } from '@generated/flags/immersiveAds';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { AnnotationType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAdsAnalyticsStyles from '../AdsAnalytics.styles';
import {
  analyticsViewTypeToPageLayoutMap,
  rewardedVideoPageLayout,
  rewardedVideoPageLayoutLegacy,
  viewTypeDefaultBreakdownDimension,
  viewTypeSpecificBreakdownDimensions,
  viewTypeSpecificFilters,
} from '../pageLayouts';
import { AnalyticsViewType, analyticsViewItems } from '../utils';

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
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Last365Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
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

const AnalyticsPageContentV2 = ({
  analyticsViewType,
  setAnalyticsViewType,
}: AnalyticsPageContentV2Props) => {
  const { classes } = useAdsAnalyticsStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  const { value: redesignFlagValue } = useFlag(isRewardedVideoRedesignEnabled);
  const isRedesignEnabled = redesignFlagValue ?? false;

  const getPageLayout = useMemo(() => {
    if (analyticsViewType === AnalyticsViewType.RewardedAds) {
      return isRedesignEnabled ? rewardedVideoPageLayout : rewardedVideoPageLayoutLegacy;
    }
    return analyticsViewTypeToPageLayoutMap[analyticsViewType] || [];
  }, [analyticsViewType, isRedesignEnabled]);

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
      <div className={clsx('flex', classes.subMenu)}>
        <div className={clsx('flex', classes.subMenuChips)}>
          {analyticsViewItems?.map((analyticsViewItem) => (
            <Chip
              key={analyticsViewItem.type}
              label={translate(analyticsViewItem.nameKey)}
              clickable
              color={analyticsViewType === analyticsViewItem.type ? 'primary' : 'secondary'}
              onClick={() => setAnalyticsViewType(analyticsViewItem.type)}
              role='tab'
              aria-selected={analyticsViewType === analyticsViewItem.type}
              tabIndex={0}
            />
          ))}
        </div>
        <Typography variant='h6' color='primary'>
          {translate(
            translationKey('Description.DataDelay', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </Typography>
      </div>

      <CreatorAnalyticsLayout config={analyticsPageConfig} />
    </div>
  );
};

export default AnalyticsPageContentV2;
