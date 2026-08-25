import type { NextLayoutPage } from 'next';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';
import CommercePageContentContainer from '@modules/commerce/pages/CommercePageContentContainer';

const CommercePage: NextLayoutPage = () => {
  return <CommercePageContentContainer />;
};

CommercePage.getPageLayout = getCommercePageLayout;
CommercePage.loggerConfig = { rosId: RosTeams.AdvertiserPublisherExperience };

export default CommercePage;
