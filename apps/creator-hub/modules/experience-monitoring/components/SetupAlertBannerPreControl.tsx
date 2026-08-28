import type { FC } from 'react';
import AnalyticsAlertClientProvider from '@modules/experience-alerts/components/AnalyticsAlertClientProvider';
import { analyticsAlertControlPlaneClient } from '@modules/experience-alerts/constants/types';
import SetupAlertBanner from './SetupAlertBanner';

const SetupAlertBannerPreControl: FC = () => {
  return (
    <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
      <SetupAlertBanner />
    </AnalyticsAlertClientProvider>
  );
};

export default SetupAlertBannerPreControl;
