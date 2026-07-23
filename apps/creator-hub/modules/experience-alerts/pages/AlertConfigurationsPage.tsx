import { useEffect } from 'react';
import { withTranslation } from '@rbx/intl';
import { analyticsAlertsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAlertConfigurationPageConfig from '../components/alertConfigurationPageConfig';
import AnalyticsAlertClientProvider from '../components/AnalyticsAlertClientProvider';
import ExperienceAlertsFlagGate from '../components/ExperienceAlertsFlagGate';
import { analyticsAlertControlPlaneClient } from '../constants/types';

const AlertConfigurationsPage = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsAlertsNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  return (
    <ExperienceAlertsFlagGate>
      {(resource) => (
        <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
          <CreatorAnalyticsLayout
            config={getAlertConfigurationPageConfig(translate, resource.id)}
          />
        </AnalyticsAlertClientProvider>
      )}
    </ExperienceAlertsFlagGate>
  );
};

export default withTranslation(AlertConfigurationsPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
