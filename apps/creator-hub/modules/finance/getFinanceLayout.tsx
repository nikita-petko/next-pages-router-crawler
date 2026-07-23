import type { ReactNode } from 'react';
import React from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import FinanceRail from './FinanceRail';

const getFinanceLayout = (page: ReactNode, { title }: { title: ReactNode }) => (
  <CreatorHubLayout
    title={title}
    noBreadCrumbs
    secondaryRail={<FinanceRail />}
    secondarySize='small'>
    {page}
  </CreatorHubLayout>
);

export default getFinanceLayout;
