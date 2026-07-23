import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import RecommendationServicePageContainer from './RecommendationServicePageContainer';
import RecommendationServiceConfigsLandingContent from './RecommendationServiceConfigsLandingContent';

type RecommendationServiceLandingTab = 'analytics' | 'configuration';

type RecommendationServiceLandingPageContainerProps = {
  initialTab?: RecommendationServiceLandingTab;
};

const RecommendationServiceLandingPageContainer: FC<
  RecommendationServiceLandingPageContainerProps
> = ({ initialTab = 'configuration' }) => {
  const router = useRouter();
  const { ready, translate, translateHTML, tPendingTranslation } =
    useTranslationWrapper(useTranslation());

  const { recommendationServicesConfigEnabled, isFetched: isRecommendationServicesConfigFetched } =
    useFeatureFlagsForNamespace(
      'recommendationServicesConfigEnabled',
      FeatureFlagNamespace.Analytics,
    );

  const tab: RecommendationServiceLandingTab = useMemo(() => {
    const fromQuery = router.query.tab;
    if (fromQuery === 'analytics' || fromQuery === 'configuration') return fromQuery;
    return initialTab;
  }, [initialTab, router.query.tab]);

  const experienceId = useMemo(() => {
    const { id } = router.query;
    return typeof id === 'string' ? id : null;
  }, [router.query]);

  const underlineTag = useMemo(
    () => ({
      opening: 'uStart',
      closing: 'uEnd',
      content(chunks: React.ReactNode) {
        return <span className='underline'>{chunks}</span>;
      },
    }),
    [],
  );

  const navigateToTab = useCallback(
    (nextTab: RecommendationServiceLandingTab) => {
      if (!experienceId) return;
      router
        .push(
          {
            pathname: '/dashboard/creations/experiences/[id]/recommendation-service',
            query: { id: experienceId, tab: nextTab },
          },
          undefined,
          { shallow: true },
        )
        .catch(() => undefined);
    },
    [experienceId, router],
  );

  useEffect(() => {
    if (!experienceId) return;
    if (
      isRecommendationServicesConfigFetched &&
      !recommendationServicesConfigEnabled &&
      tab === 'configuration'
    ) {
      navigateToTab('analytics');
    }
  }, [
    experienceId,
    isRecommendationServicesConfigFetched,
    navigateToTab,
    recommendationServicesConfigEnabled,
    tab,
  ]);

  const onCreate = useCallback(() => {
    if (!experienceId) return;
    router
      .push(
        '/dashboard/creations/experiences/[id]/recommendation-service/create',
        `/dashboard/creations/experiences/${experienceId}/recommendation-service/create`,
      )
      .catch(() => undefined);
  }, [experienceId, router]);

  const title = translate(
    translationKey('Heading.RecommendationService', TranslationNamespace.RecommendationService),
  );
  const subtitle = translateHTML(
    translationKey(
      'Description.RecommendationServiceDescription',
      TranslationNamespace.RecommendationService,
    ),
    [underlineTag],
  );

  const tabAnalyticsLabel = translate(
    translationKey('Heading.Analytics', TranslationNamespace.Analytics),
  );
  const tabConfigurationLabel = tPendingTranslation(
    'Configuration',
    'Tab label for the configuration view on the recommendation service landing page',
    translationKey('Tab.Configuration', TranslationNamespace.RecommendationService),
  );
  const createLabel = tPendingTranslation(
    'Create',
    'Button to create a new service config',
    translationKey('Action.Create', TranslationNamespace.RecommendationService),
  );

  const emptyTitle = translate(
    translationKey(
      'EmptyState.Title.RecommendationService',
      TranslationNamespace.RecommendationService,
    ),
  );
  const emptyDescription = translate(
    translationKey(
      'EmptyState.Description.RecommendationService',
      TranslationNamespace.RecommendationService,
    ),
  );

  if (!ready) {
    return <CircularProgress data-testid='loading' />;
  }

  if (!isRecommendationServicesConfigFetched) {
    return <CircularProgress data-testid='loading' />;
  }

  const isConfigEnabled =
    isRecommendationServicesConfigFetched && recommendationServicesConfigEnabled;

  const effectiveTab: RecommendationServiceLandingTab = isConfigEnabled ? tab : 'analytics';

  return (
    <div className='flex flex-col gap-xlarge'>
      <div className='flex flex-wrap items-start justify-between gap-xlarge'>
        <div className='flex flex-1 flex-col gap-xsmall' style={{ minWidth: 300 }}>
          <div className='text-heading-large content-emphasis'>{title}</div>
          <div className='text-body-medium content-default'>{subtitle}</div>
        </div>
        <div className='flex items-start gap-small'>
          {isConfigEnabled ? (
            <Button variant='Emphasis' size='Medium' onClick={onCreate}>
              {createLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs
        value={effectiveTab}
        onValueChange={(v) => navigateToTab(v as RecommendationServiceLandingTab)}>
        <TabsList>
          <TabsTrigger value='analytics'>{tabAnalyticsLabel}</TabsTrigger>
          {isConfigEnabled ? (
            <TabsTrigger value='configuration'>{tabConfigurationLabel}</TabsTrigger>
          ) : null}
        </TabsList>
      </Tabs>

      {effectiveTab === 'analytics' ? <RecommendationServicePageContainer /> : null}
      {effectiveTab === 'configuration' && experienceId ? (
        <RecommendationServiceConfigsLandingContent
          experienceId={experienceId}
          onCreate={onCreate}
          createLabel={createLabel}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : null}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(RecommendationServiceLandingPageContainer, [
  TranslationNamespace.RecommendationService,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
