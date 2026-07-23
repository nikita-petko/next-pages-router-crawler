import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import BuildContainer from '@modules/landing/buildLanding/components/BuildContainer';

const getBuildPageLayout = (page: ReactNode) => (
  <IALayoutExperiment title='Heading.Program' usePrimaryInGuestMode noBreadCrumbs>
    {page}
  </IALayoutExperiment>
);

const BuildPage: NextLayoutPage = () => <BuildContainer />;

BuildPage.getPageLayout = getBuildPageLayout;

export default BuildPage;
