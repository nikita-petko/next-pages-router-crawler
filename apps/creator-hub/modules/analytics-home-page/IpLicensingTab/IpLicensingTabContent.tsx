import type { FunctionComponent } from 'react';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import IpLicensingEarningsPage from '@modules/ip-analytics/IpLicensingEarningsPage';

const IpLicensingTabContent: FunctionComponent = () => {
  return (
    <AnalyticsTabContentLayout controls={[]}>
      <IpLicensingEarningsPage />
    </AnalyticsTabContentLayout>
  );
};

export default IpLicensingTabContent;
