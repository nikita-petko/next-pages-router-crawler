import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateProductsContentContainer from '@modules/commerce/pages/CreateProductsPageContentContainer';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';

const CreateProducts: NextLayoutPage = () => (
  <Authenticated>
    <CreateProductsContentContainer />
  </Authenticated>
);

CreateProducts.getPageLayout = getCommercePageLayout;

export default CreateProducts;
