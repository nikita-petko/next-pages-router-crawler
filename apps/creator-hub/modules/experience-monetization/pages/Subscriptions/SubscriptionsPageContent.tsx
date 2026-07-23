import { useMemo, useState } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsSubscriptionsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import SubscriptionsTableContainer from '@modules/experience-subscriptions/containers/SubscriptionsTableContainer';
import { ExperienceSubscriptionsClientProvider } from '@modules/experience-subscriptions/context/ExperienceSubscriptionsClientProvider';
import AnalyticsTabContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/AnalyticsTabContent';
import HistoryTabContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/HistoryTabContent';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';

enum SubscriptionsPageTabKey {
  Creations = 'Creations',
  Analytics = 'Analytics',
  History = 'History',
}

// TODO(gperkins@20260210): Remove empty configs per DSA-5306
const config: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  filterDimensions: [],
  breakdownDimensions: [],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365,
  },
  surfaceAnnotationOptions: {
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
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  body: [],
};

function SubscriptionsPageContent() {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const creationsTab = useMemo(() => {
    let content;
    if (!universeId) {
      content = (
        <EmptyGrid>
          <CircularProgress color='secondary' />
        </EmptyGrid>
      );
    } else {
      content = (
        <ExperienceSubscriptionsClientProvider>
          <SubscriptionsTableContainer universeId={universeId} />
        </ExperienceSubscriptionsClientProvider>
      );
    }

    return {
      key: SubscriptionsPageTabKey.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content,
    };
  }, [translate, universeId]);

  const analyticsTab = useMemo(
    () => ({
      key: SubscriptionsPageTabKey.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: (
        <AnalyticsContextLayerInnerProvider config={config}>
          <AnalyticsTabContent showDataMayBeBehindLabel />
        </AnalyticsContextLayerInnerProvider>
      ),
    }),
    [translate],
  );

  const historyTab = useMemo(
    () => ({
      key: SubscriptionsPageTabKey.History,
      label: translate(translationKey('Tab.History', TranslationNamespace.ExperienceSubscriptions)),
      content: <HistoryTabContent />,
    }),
    [translate],
  );

  const createSubscriptionLink = universeId
    ? `/dashboard/creations/experiences/${universeId}/experience-subscriptions/create`
    : '#';

  const orderedTabs = useMemo(() => {
    const tabs = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
      tabs.push(historyTab);
    }
    return tabs;
  }, [permissions, userCanViewAnalyticsForUniverse, creationsTab, analyticsTab, historyTab]);

  const ROBUX_BANNER_DISMISSED_KEY = 'robuxSubscriptionsBannerDismissed';
  const [isRobuxBannerDismissed, setIsRobuxBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(ROBUX_BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissRobuxBanner = () => {
    setIsRobuxBannerDismissed(true);
    try {
      localStorage.setItem(ROBUX_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  const robuxBannerElement = !isRobuxBannerDismissed ? (
    <FeedbackBanner
      title={translate(
        translationKey(
          'Heading.RobuxSubscriptionsBanner',
          TranslationNamespace.ExperienceSubscriptions,
        ),
      )}
      description={translate(
        translationKey(
          'Description.RobuxSubscriptionsBanner',
          TranslationNamespace.ExperienceSubscriptions,
        ),
      )}
      layout='Stacked'
      variant='Emphasis'
      severity='Info'
      primaryActionLabel={translate(
        translationKey('Action.GetStarted', TranslationNamespace.ExperienceSubscriptions),
      )}
      onPrimaryAction={() => {
        window.location.href = createSubscriptionLink;
      }}
      onDismiss={handleDismissRobuxBanner}
    />
  ) : undefined;

  if (isPendingAnalyticsExperiencePermissions || isLoadingPermissions || isLoadingUniverse) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // TODO(DSA-3204): Migrate away from the deprecated analytics tabbed page layout.
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    <ExperienceAnalyticsTabbedPageLayout
      heroElement={robuxBannerElement}
      addHeroDivider={false}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsSubscriptionsNavigationItem}
    />
  );
}

export default withTranslation(SubscriptionsPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.ExperienceSubscriptions,
]);
