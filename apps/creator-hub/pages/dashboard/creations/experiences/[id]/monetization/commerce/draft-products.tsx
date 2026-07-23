import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import DraftProductsContentContainer from '@modules/commerce/pages/DraftProductsPageContentContainer';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';

const DraftProducts: NextLayoutPage = () => (
  <Authenticated>
    <DraftProductsContentContainer />
  </Authenticated>
);

DraftProducts.getPageLayout = getCommercePageLayout;

export default DraftProducts;
