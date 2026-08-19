import type { FC } from 'react';
import { useRouter } from 'next/router';
import { SystemBanner } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useAnalyticsAlertsListQuery from '@modules/experience-alerts/hooks/useAnalyticsAlertsListQuery';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useHasUserSeenFeature } from '@modules/experience-analytics-shared/hooks/useHasUserSeenFeature';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

const SETUP_ALERT_BANNER_FEATURE_KEY = 'performance.setupAlertBanner';

/**
 * Prompts the creator to set up an alert when they have manage-alerts
 * permission but haven't configured any alerts for this universe yet.
 * Dismissing it hides it permanently (per user, per universe).
 */
const SetupAlertBanner: FC = () => {
  const router = useRouter();
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const { isPending: isPermissionsPending, userCanManageAnalyticsAlertForUniverse } =
    useAnalyticsExperiencePermissions(universeId);
  const { data: alerts, isSuccess: isAlertsListLoaded } = useAnalyticsAlertsListQuery(universeId);
  const {
    hasUserSeen: isDismissed,
    setHasUserSeen: setDismissed,
    isReady: isDismissedStateReady,
  } = useHasUserSeenFeature(SETUP_ALERT_BANNER_FEATURE_KEY);

  const hasNoAlertsConfigured = isAlertsListLoaded && (alerts?.length ?? 0) === 0;

  const shouldShow =
    !isPermissionsPending &&
    userCanManageAnalyticsAlertForUniverse &&
    hasNoAlertsConfigured &&
    isDismissedStateReady &&
    !isDismissed;

  if (shouldShow) {
    return (
      // oxlint-disable-next-line typescript/no-deprecated -- SystemBanner is the Foundation component for page-level informational banners.
      <SystemBanner
        className='margin-bottom-small width-full'
        title={translate(
          translationKey('Title.SetupAlertBanner', TranslationNamespace.ExperienceAlerts),
        )}
        description={translate(
          translationKey('Description.SetupAlertBanner', TranslationNamespace.ExperienceAlerts),
        )}
        severity='Info'
        variant='Standard'
        infoIconOverride='icon-regular-circle-i'
        primaryActionLabel={translate(
          translationKey('Action.ViewAlerts', TranslationNamespace.ExperienceAlerts),
        )}
        onPrimaryAction={() => router.push(creatorHub.dashboard.getExperienceAlertsUrl(universeId))}
        onDismiss={() => setDismissed(true)}
        dismissIconAriaLabel={translate(
          translationKey('Action.Dismiss', TranslationNamespace.Controls),
        )}
      />
    );
  }

  return null;
};

export default withTranslation(SetupAlertBanner, [
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Controls,
]);
