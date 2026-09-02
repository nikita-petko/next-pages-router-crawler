import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Chip, Typography } from '@rbx/ui';
import {
  isAdsPageRedesignEnabled,
  isManagedRewardedTabEnabled,
} from '@generated/flags/immersiveAds';
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
import usePlayWithRewardPlacementIds from '../../hooks/usePlayWithRewardPlacementIds';
import useAdsAnalyticsStyles from '../AdsAnalytics.styles';
import {
  analyticsViewTypeToPageLayoutMap,
  overviewPageLayoutRedesign,
  rewardedVideoPageLayout,
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

  const { value: adsPageRedesignFlagValue } = useFlag(isAdsPageRedesignEnabled);
  const isAdsPageRedesignOn = adsPageRedesignFlagValue ?? false;

  const { ready: isManagedRewardedTabFlagReady, value: managedRewardedTabFlagValue } = useFlag(
    isManagedRewardedTabEnabled,
  );
  const isManagedRewardedTabOn = managedRewardedTabFlagValue ?? false;

  const { placementIds: playWithRewardPlacementIds, isLoading: arePlacementIdsLoading } =
    usePlayWithRewardPlacementIds(isManagedRewardedTabOn);

  // The tab has nothing to say about a universe with no Play with Reward
  // placements, and cannot even be scoped for one: the ids are what scopes it,
  // and `sanitizeFilterValuesForBackend` drops a filter with no values, so an
  // empty set would report all rewarded video as Play with Reward.
  const isManagedRewardedTabAvailable =
    isManagedRewardedTabOn && playWithRewardPlacementIds.length > 0;

  const visibleAnalyticsViewItems = useMemo(
    () =>
      analyticsViewItems.filter(
        (item) => item.type !== AnalyticsViewType.ManagedRewarded || isManagedRewardedTabAvailable,
      ),
    [isManagedRewardedTabAvailable],
  );

  // Deep links carry the view type in a query param, so a stale or hand-edited
  // `adType` can select a gated tab. Fall back to Overview rather than render a
  // tab with no chip to navigate away from.
  const activeAnalyticsViewType =
    analyticsViewType === AnalyticsViewType.ManagedRewarded && !isManagedRewardedTabAvailable
      ? AnalyticsViewType.Overview
      : analyticsViewType;

  // Both the flag and the placement ids resolve asynchronously, so a deep link to
  // the gated tab would otherwise mount the Overview layout and fire its queries
  // on the first render, then swap once the answers arrive. Neither layout is the
  // right one to mount while they are unknown, so hold the layout back.
  const isManagedRewardedTabPending =
    analyticsViewType === AnalyticsViewType.ManagedRewarded &&
    (!isManagedRewardedTabFlagReady || arePlacementIdsLoading);

  // Implied non-empty: `activeAnalyticsViewType` only stays on this tab when
  // `isManagedRewardedTabAvailable`, which requires at least one placement id.
  const isManagedRewardedTabActive = activeAnalyticsViewType === AnalyticsViewType.ManagedRewarded;

  const getPageLayout = useMemo(() => {
    if (activeAnalyticsViewType === AnalyticsViewType.Overview && isAdsPageRedesignOn) {
      return overviewPageLayoutRedesign;
    }
    if (activeAnalyticsViewType === AnalyticsViewType.RewardedAds) {
      return rewardedVideoPageLayout;
    }
    return analyticsViewTypeToPageLayoutMap[activeAnalyticsViewType] || [];
  }, [activeAnalyticsViewType, isAdsPageRedesignOn]);

  const analyticsPageConfig: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Embedded,
      resourceTypes: [ChartResourceType.Universe],
      timeRangeOptions: immersiveAdsTimeRangeOptions,
      surfaceAnnotationOptions: immersiveAdsSurfaceAnnotationOptions,
      filterDimensions: [...filterDimensions, ...viewTypeSpecificFilters[activeAnalyticsViewType]],
      // Not listed in `filterDimensions`, so no filter chip appears for it — the
      // scoping is a property of the tab, not something a creator picks.
      defaultFilters: isManagedRewardedTabActive
        ? [
            {
              dimension: RAQIV2Dimension.AdPlacementId,
              values: playWithRewardPlacementIds,
            },
          ]
        : [],
      breakdownDimensions: [
        ...breakdownDimensions,
        ...viewTypeSpecificBreakdownDimensions[activeAnalyticsViewType],
      ],
      defaultBreakdown: viewTypeDefaultBreakdownDimension[activeAnalyticsViewType],
      body: getPageLayout,
    }),
    [
      activeAnalyticsViewType,
      getPageLayout,
      isManagedRewardedTabActive,
      playWithRewardPlacementIds,
    ],
  );

  return (
    <div>
      <div className={clsx('flex', classes.subMenu)}>
        <div className={clsx('flex', classes.subMenuChips)}>
          {visibleAnalyticsViewItems.map((analyticsViewItem) => (
            <Chip
              key={analyticsViewItem.type}
              label={translate(analyticsViewItem.nameKey)}
              clickable
              color={activeAnalyticsViewType === analyticsViewItem.type ? 'primary' : 'secondary'}
              onClick={() => setAnalyticsViewType(analyticsViewItem.type)}
              role='tab'
              aria-selected={activeAnalyticsViewType === analyticsViewItem.type}
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

      {!isManagedRewardedTabPending && <CreatorAnalyticsLayout config={analyticsPageConfig} />}
    </div>
  );
};

export default AnalyticsPageContentV2;
