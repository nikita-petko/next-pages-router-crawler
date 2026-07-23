import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';
import DraftProductsContentContainer from '@modules/commerce/pages/DraftProductsPageContentContainer';

const DraftProducts: NextLayoutPage = () => (
  <Authenticated>
    <DraftProductsContentContainer />
  </Authenticated>
);

DraftProducts.getPageLayout = getCommercePageLayout;
DraftProducts.loggerConfig = { rosId: RosTeams.AdvertiserPublisherExperience };

export default DraftProducts;
