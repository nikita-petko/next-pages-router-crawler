import { useCallback, useMemo, type FC } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import AnalyticsAlertClientProvider, {
  useAnalyticsAlertClient,
} from '../components/AnalyticsAlertClientProvider';
import ExperienceAlertForm from '../components/ExperienceAlertForm/ExperienceAlertForm';
import ExperienceAlertsFlagGate from '../components/ExperienceAlertsFlagGate';
import {
  analyticsAlertControlPlaneClient,
  type ExperienceAlertFormValues,
} from '../constants/types';
import analyticsAlertPrefillFromQuery from '../utils/analyticsAlertPrefillFromQuery';

const CreateAlertPageContent: FC<{
  resource: RAQIV2ChartResource;
  prefill?: Partial<ExperienceAlertFormValues>;
}> = ({ resource, prefill }) => {
  const alertClient = useAnalyticsAlertClient();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (values: ExperienceAlertFormValues) => {
      await alertClient.createAlert(resource.id, values);
      await router.push(creatorHub.dashboard.getExperienceAlertsUrl(resource.id));
    },
    [alertClient, resource.id, router],
  );

  const handleCancel = useCallback(() => {
    void router.push(creatorHub.dashboard.getExperienceAlertsUrl(resource.id));
  }, [resource.id, router]);

  return (
    <ExperienceAlertForm
      pageTitleKey={translationKey('Heading.CreateAlert', TranslationNamespace.ExperienceAlerts)}
      resource={resource}
      defaultValues={prefill}
      allowPristineSubmit={prefill != null}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

const CreateAlertPageBody: FC<{
  resource: RAQIV2ChartResource;
  prefill?: Partial<ExperienceAlertFormValues>;
}> = ({ resource, prefill }) => {
  const {
    userCanManageAnalyticsAlertForUniverse,
    isPending: isPendingAnalyticsExperiencePermissions,
  } = useAnalyticsExperiencePermissions(resource.id);
  const { translate } = useTranslationWrapper(useTranslation());

  const surfaceConfig = useMemo(
    () => ({
      ...defaultAnalyticsPageSurfaceConfig,
      resourceTypes: [resource.type],
    }),
    [resource.type],
  );

  if (isPendingAnalyticsExperiencePermissions) {
    return <PageLoading />;
  }

  if (!userCanManageAnalyticsAlertForUniverse) {
    return (
      <p className='text-body-medium content-default'>
        {translate(
          translationKey('Message.PermissionDenied', TranslationNamespace.ExperienceAlerts),
        )}
      </p>
    );
  }

  return (
    <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
      <AnalyticsContextLayerInnerProvider config={surfaceConfig}>
        <CreateAlertPageContent resource={resource} prefill={prefill} />
      </AnalyticsContextLayerInnerProvider>
    </AnalyticsAlertClientProvider>
  );
};

/**
 * `prefill` lets a caller seed the create form's fields (any subset of
 * `ExperienceAlertFormValues`). When omitted, the page derives the prefill from
 * the URL query (e.g. the chart "Create alert" deep link) via
 * {@link analyticsAlertPrefillFromQuery}; an explicit `prefill` prop always
 * overrides the URL. The resolved object is memoized so the form's not-dirty
 * reset effect doesn't re-apply it on every parent render.
 */
const CreateAlertPage: FC<{ prefill?: Partial<ExperienceAlertFormValues> }> = ({ prefill }) => {
  const router = useRouter();
  // Deep links are a read-once concern: snapshot the prefill when the router
  // first becomes ready and keep that object identity stable afterwards.
  // Depending on `router.query` here would recompute on its per-render identity
  // churn, re-firing the form's not-dirty `reset` and wiping field state that
  // mounts asynchronously (e.g. the auto-selected breakdown categories).
  const resolvedPrefill = useMemo(() => {
    if (prefill != null) {
      return prefill;
    }
    // oxlint-disable-next-line react/react-compiler -- read the URL query once when the router becomes ready; ignore later router.query identity churn
    return router.isReady ? analyticsAlertPrefillFromQuery(router.query) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read the URL query once when the router becomes ready; ignore later router.query identity churn
  }, [prefill, router.isReady]);

  return (
    <ExperienceAlertsFlagGate>
      {(resource) => <CreateAlertPageBody resource={resource} prefill={resolvedPrefill} />}
    </ExperienceAlertsFlagGate>
  );
};

export default withTranslation(CreateAlertPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
