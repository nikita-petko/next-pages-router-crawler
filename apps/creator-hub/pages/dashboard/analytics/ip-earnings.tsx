import type { NextLayoutPage } from 'next';
import getAnalyticsHomePageLayout from '@modules/analytics-home-page/getAnalyticsHomePageLayout';
import IpLicensingEarningsPage from '@modules/ip-analytics/IpLicensingEarningsPage';

const IpLicensingEarningsAnalyticsPage: NextLayoutPage = () => {
  return <IpLicensingEarningsPage />;
};

IpLicensingEarningsAnalyticsPage.getPageLayout = getAnalyticsHomePageLayout;
IpLicensingEarningsAnalyticsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpLicensingEarningsAnalyticsPage;
