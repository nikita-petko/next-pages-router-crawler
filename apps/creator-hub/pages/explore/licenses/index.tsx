import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import AppNavigationLayout from '@modules/navigation/layout/components/AppLayout';
import LicensesContainer from '@modules/licenses/containers/LicensesContainer';
import IPContainer from '@modules/licenses/containers/IPContainer';

const getLicensesPageLayout = (page: ReactNode) => (
  <AppNavigationLayout disableLeftNavigation noBreadCrumbs>
    {page}
  </AppNavigationLayout>
);

const Licenses: NextLayoutPage = () => {
  return (
    <IPContainer>
      <LicensesContainer />
    </IPContainer>
  );
};

Licenses.getPageLayout = getLicensesPageLayout;

export default Licenses;
