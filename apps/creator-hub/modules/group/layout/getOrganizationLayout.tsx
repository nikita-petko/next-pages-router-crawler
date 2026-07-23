import type { ReactNode } from 'react';
import React from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import FinanceRail from '@modules/finance/FinanceRail';
import OrganizationLeftRail from '../components/OrganizationLeftRail';
import OrganizationLayout from './OrganizationLayout';

type TOrganizationLayoutProps = {
  title?: string | ReactNode;
  financeRail?: boolean;
};
const getOrganizationLayout = (
  page: ReactNode,
  { title, financeRail = false }: TOrganizationLayoutProps,
) => (
  <CreatorHubLayout
    title={title}
    secondaryRail={financeRail ? <FinanceRail /> : <OrganizationLeftRail />}
    secondarySize='small'
    noBreadCrumbs>
    <OrganizationLayout>{page}</OrganizationLayout>
  </CreatorHubLayout>
);

export default getOrganizationLayout;
