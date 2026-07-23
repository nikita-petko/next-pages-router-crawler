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
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import AnalyticsAlertClientProvider, {
  useAnalyticsAlertClient,
} from '../components/AnalyticsAlertClientProvider';
import ExperienceAlertForm from '../components/ExperienceAlertForm/ExperienceAlertForm';
import ExperienceAlertsFlagGate from '../components/ExperienceAlertsFlagGate';
import {
  analyticsAlertControlPlaneClient,
  type ExperienceAlertFormValues,
} from '../constants/types';
import useCurrentAnalyticsAlertDetail from '../hooks/useCurrentAnalyticsAlertDetail';
import analyticsAlertDetailToFormValues from '../utils/analyticsAlertDetailToFormValues';

const ConfigureAlertPageContent: FC<{ resource: RAQIV2ChartResource; alertId: string }> = ({
  resource,
  alertId,
}) => {
  const alertClient = useAnalyticsAlertClient();
  const router = useRouter();

  const {
    data: alertDetail,
    isLoading: isAlertLoading,
    isFetched,
    isError,
  } = useCurrentAnalyticsAlertDetail(resource.id, alertId);

  useBreadcrumbRegistration(BreadcrumbItemType.Alerts, alertDetail?.name);

  const defaultValues = useMemo(() => {
    if (!alertDetail) {
      return undefined;
    }
    return analyticsAlertDetailToFormValues(alertDetail);
  }, [alertDetail]);

  const handleSubmit = useCallback(
    async (values: ExperienceAlertFormValues) => {
      if (!alertId) {
        return;
      }
      await alertClient.updateAlert(resource.id, alertId, values);
      await router.push(creatorHub.dashboard.getExperienceAlertsUrl(resource.id));
    },
    [alertClient, alertId, resource.id, router],
  );

  const handleCancel = useCallback(() => {
    void router.push(creatorHub.dashboard.getExperienceAlertsUrl(resource.id));
  }, [resource.id, router]);

  if (defaultValues) {
    return (
      <ExperienceAlertForm
        pageTitleKey={translationKey(
          'Heading.ConfigureAlert',
          TranslationNamespace.ExperienceAlerts,
        )}
        resource={resource}
        defaultValues={defaultValues}
        submitButtonKey={translationKey('Action.Save', TranslationNamespace.Controls)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

  if (isError || (!isAlertLoading && isFetched && !defaultValues)) {
    void router.replace('/404');
    return null;
  }

  return <PageLoading />;
};

const ConfigureAlertPageBody: FC<{ resource: RAQIV2ChartResource; alertId: string }> = ({
  resource,
  alertId,
}) => {
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
        <ConfigureAlertPageContent resource={resource} alertId={alertId} />
      </AnalyticsContextLayerInnerProvider>
    </AnalyticsAlertClientProvider>
  );
};

const ConfigureAlertPage: FC = () => {
  const router = useRouter();

  const rawAlertIdParam = router.query.alertId;
  const alertId: string | undefined =
    router.isReady && typeof rawAlertIdParam === 'string' && rawAlertIdParam.length > 0
      ? rawAlertIdParam
      : undefined;

  if (!alertId) {
    return <PageLoading />;
  }

  return (
    <ExperienceAlertsFlagGate>
      {(resource) => <ConfigureAlertPageBody resource={resource} alertId={alertId} />}
    </ExperienceAlertsFlagGate>
  );
};

export default withTranslation(ConfigureAlertPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
