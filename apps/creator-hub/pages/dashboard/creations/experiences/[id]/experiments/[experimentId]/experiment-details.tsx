import React from 'react';
import type { NextLayoutPage } from 'next';
import ExperimentDetailsPage from '@modules/remote-configs/experimentation/pages/ExperimentDetailsPage';

const ExperimentDetails: NextLayoutPage = () => {
  return <ExperimentDetailsPage />;
};

ExperimentDetails.getPageLayout = (page) => page;

export default ExperimentDetails;
