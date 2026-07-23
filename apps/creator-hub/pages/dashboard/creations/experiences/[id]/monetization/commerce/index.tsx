import React from 'react';
import type { NextLayoutPage } from 'next';
import CommercePageContentContainer from '@modules/commerce/pages/CommercePageContentContainer';
import getCommercePageLayout from '@modules/commerce/layout/getCommercePageLayout';

const CommercePage: NextLayoutPage = () => {
  return <CommercePageContentContainer />;
};

CommercePage.getPageLayout = getCommercePageLayout;

export default CommercePage;
