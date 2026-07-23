import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import FinanceRail from './FinanceRail';

const getFinanceLayout = (page: ReactNode, { title }: { title: string }) => (
  <IALayoutExperiment
    title={title}
    noBreadCrumbs
    secondaryRail={<FinanceRail />}
    secondarySize='small'>
    {page}
  </IALayoutExperiment>
);

export default getFinanceLayout;
