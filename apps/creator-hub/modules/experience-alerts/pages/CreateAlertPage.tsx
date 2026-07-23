import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { PageLoading, urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AnalyticsContextLayerInnerProvider,
  defaultAnalyticsPageSurfaceConfig,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import ExperienceAlertForm from '../components/ExperienceAlertForm/ExperienceAlertForm';
import type { ExperienceAlertFormValues } from '../constants/types';

const CreateAlertPage = () => {
  const { isExperienceAlertsEnabled, isFetched: isFlagsReady } = useFeatureFlagsForNamespace(
    'isExperienceAlertsEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const resource = useUniverseResource();
  const isResourceLoading = resource.isLoading;
  const router = useRouter();
  const { translate } = useRAQIV2TranslationDependencies();

  const surfaceConfig = useMemo(
    () => ({
      ...defaultAnalyticsPageSurfaceConfig,
      resourceTypes: [resource.type],
    }),
    [resource.type],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- DSA-5483: submit handler pending API
  const handleSubmit = useCallback((values: ExperienceAlertFormValues) => {
    // eslint-disable-next-line no-console -- TODO(DSA-5483): wire to create-alert API when available
    console.log('values', values);
  }, []);

  const handleCancel = useCallback(() => {
    router.push(urls.creatorHub.dashboard.getExperienceAlertsUrl(resource.id));
  }, [resource.id, router]);

  if (isFlagsReady && !isResourceLoading) {
    if (isExperienceAlertsEnabled) {
      return (
        <AnalyticsContextLayerInnerProvider config={surfaceConfig}>
          <ExperienceAlertForm
            pageTitle={translate(
              translationKey('Heading.CreateAlert', TranslationNamespace.ExperienceAlerts),
            )}
            resource={resource}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </AnalyticsContextLayerInnerProvider>
      );
    }
    router.push('/404');
    return null;
  }

  return <PageLoading />;
};

export default withTranslation(CreateAlertPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
