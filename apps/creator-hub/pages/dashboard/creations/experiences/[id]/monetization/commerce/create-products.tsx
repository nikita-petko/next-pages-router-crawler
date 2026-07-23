import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';
import CreateProductsContentContainer from '@modules/commerce/pages/CreateProductsPageContentContainer';

const CreateProducts: NextLayoutPage = () => (
  <Authenticated>
    <CreateProductsContentContainer />
  </Authenticated>
);

CreateProducts.getPageLayout = getCommercePageLayout;
CreateProducts.loggerConfig = { rosId: RosTeams.AdvertiserPublisherExperience };

export default CreateProducts;
