import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { PageNotFound } from '@modules/miscellaneous/error';

const getCustom404PagePageLayout = (page: ReactNode) => (
  <IALayoutExperiment disableLeftNavigation>{page}</IALayoutExperiment>
);

const Custom404Page: NextLayoutPage = () => {
  return <PageNotFound />;
};

Custom404Page.getPageLayout = getCustom404PagePageLayout;

export default Custom404Page;
