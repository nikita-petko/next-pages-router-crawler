import React, { FC, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsFlagGatedContext } from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- Avoid circular dependency, import directly instead of from barrel file
import { RecommendationServiceServiceWizard } from './RecommendationServiceCreateServicePageContainer';

const RecommendationServiceEditServicePageContainerInner: FC = () => {
  const router = useRouter();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const experienceId = useMemo(() => {
    const { id } = router.query;
    return typeof id === 'string' ? id : null;
  }, [router.query]);

  const editKey = useMemo(() => {
    const { key } = router.query;
    return typeof key === 'string' ? key : null;
  }, [router.query]);

  const missingKeyTitle = tPendingTranslation(
    'Missing config key',
    'Error message shown when the URL is missing the config key parameter for editing',
    translationKey('Edit.Error.MissingKey', TranslationNamespace.RecommendationService),
  );
  const backLabel = translate(
    translationKey('Label.BackToOverview', TranslationNamespace.Controls),
  );

  if (!router.isReady) {
    return <CircularProgress data-testid='loading' />;
  }

  if (!editKey) {
    return (
      <div className='flex flex-col gap-medium padding-xlarge'>
        <FeedbackBanner severity='Error' layout='Inline' title={missingKeyTitle} />
        <div>
          <Button
            variant='Standard'
            size='Small'
            onClick={() => {
              if (!experienceId) return;
              router
                .push(
                  '/dashboard/creations/experiences/[id]/recommendation-service',
                  `/dashboard/creations/experiences/${experienceId}/recommendation-service?tab=configuration`,
                )
                .catch(() => undefined);
            }}>
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  return <RecommendationServiceServiceWizard mode='edit' editKey={editKey} />;
};

const RecommendationServiceEditServicePageContainer: FC = () => {
  return (
    <AnalyticsFlagGatedContext flag='recommendationServicesConfigEnabled'>
      <RecommendationServiceEditServicePageContainerInner />
    </AnalyticsFlagGatedContext>
  );
};

export default withNamespaceSwitchedTranslation(RecommendationServiceEditServicePageContainer, [
  TranslationNamespace.RecommendationService,
  TranslationNamespace.Controls,
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Error,
]);
