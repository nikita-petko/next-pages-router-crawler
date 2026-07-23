import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import FinanceRail from '@modules/finance/FinanceRail';
import OrganizationLayout from './OrganizationLayout';
import OrganizationLeftRail from '../components/OrganizationLeftRail';

type TOrganizationLayoutProps = {
  title?: string;
  financeRail?: boolean;
};
const getOrganizationLayout = (
  page: ReactNode,
  { title, financeRail = false }: TOrganizationLayoutProps,
) => (
  <IALayoutExperiment
    title={title}
    secondaryRail={financeRail ? <FinanceRail /> : <OrganizationLeftRail />}
    secondarySize='small'
    noBreadCrumbs>
    <OrganizationLayout>{page}</OrganizationLayout>
  </IALayoutExperiment>
);

export default getOrganizationLayout;
