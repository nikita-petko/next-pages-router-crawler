import type { FC, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Divider, Tab, Tabs } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RecommendationServiceConfigsLandingContent from './RecommendationServiceConfigsLandingContent';
import RecommendationServicePageContainer, {
  recommendationServiceDocLink,
} from './RecommendationServicePageContainer';

type RecommendationServiceLandingTab = 'analytics' | 'configuration';

type RecommendationServiceLandingPageContainerProps = {
  initialTab?: RecommendationServiceLandingTab;
};

const PAGE_HEADER_TEXT_MIN_WIDTH_CLASS = 'min-width-[300px]';

const isRecommendationServiceLandingTab = (
  value: string,
): value is RecommendationServiceLandingTab => {
  return value === 'analytics' || value === 'configuration';
};

const RecommendationServiceLandingPageContainer: FC<
  RecommendationServiceLandingPageContainerProps
> = ({ initialTab = 'configuration' }) => {
  const router = useRouter();
  const { ready, translate, translateHTML, tPendingTranslation } =
    useTranslationWrapper(useTranslation());

  const tab: RecommendationServiceLandingTab = useMemo(() => {
    const fromQuery = router.query.tab;
    if (fromQuery === 'analytics' || fromQuery === 'configuration') {
      return fromQuery;
    }
    return initialTab;
  }, [initialTab, router.query.tab]);

  const experienceId = useMemo(() => {
    const { id } = router.query;
    return typeof id === 'string' ? id : null;
  }, [router.query]);

  const navigateToTab = useCallback(
    (nextTab: RecommendationServiceLandingTab) => {
      if (!experienceId) {
        return;
      }
      router
        .push(
          {
            pathname: '/dashboard/creations/experiences/[id]/recommendation-service',
            query: { id: experienceId, tab: nextTab },
          },
          undefined,
          { shallow: true },
        )
        .catch(() => {});
    },
    [experienceId, router],
  );

  const handleTabValueChange = useCallback(
    (_event: unknown, nextTab: unknown) => {
      if (typeof nextTab === 'string' && isRecommendationServiceLandingTab(nextTab)) {
        navigateToTab(nextTab);
      }
    },
    [navigateToTab],
  );

  const onCreate = useCallback(() => {
    if (!experienceId) {
      return;
    }
    router
      .push(
        '/dashboard/creations/experiences/[id]/recommendation-service/create',
        `/dashboard/creations/experiences/${experienceId}/recommendation-service/create`,
      )
      .catch(() => {});
  }, [experienceId, router]);

  const title = translate(
    translationKey('Heading.RecommendationService', TranslationNamespace.RecommendationService),
  );
  const subtitle = translateHTML(
    translationKey(
      'Description.RecommendationServiceDescription',
      TranslationNamespace.RecommendationService,
    ),
    [
      {
        opening: 'linkStart',
        closing: 'linkEnd',
        content: (chunks: ReactNode) => (
          <Link href={recommendationServiceDocLink} target='_blank' underline='always'>
            {chunks}
          </Link>
        ),
      },
    ],
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

  return (
    <div className='flex flex-col gap-xlarge'>
      <div className='flex items-start justify-between gap-xlarge wrap'>
        <div className={`flex flex-col gap-xsmall grow-1 ${PAGE_HEADER_TEXT_MIN_WIDTH_CLASS}`}>
          <div className='text-heading-large content-emphasis'>{title}</div>
          <div className='text-body-large content-default'>{subtitle}</div>
        </div>
        <div className='flex items-start gap-small'>
          <Button variant='Emphasis' size='Medium' onClick={onCreate}>
            {createLabel}
          </Button>
        </div>
      </div>

      <div data-testid='recommendation-service-tabs'>
        <Tabs
          value={tab}
          onChange={handleTabValueChange}
          orientation='horizontal'
          variant='scrollable'>
          <Tab label={tabAnalyticsLabel} value='analytics' />
          <Tab label={tabConfigurationLabel} value='configuration' />
        </Tabs>
        <Divider />
      </div>

      {tab === 'analytics' ? <RecommendationServicePageContainer /> : null}
      {tab === 'configuration' && experienceId ? (
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
