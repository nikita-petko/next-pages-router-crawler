import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpFamilyDetailsContainer from '@modules/ip/ipFamilies/containers/IpFamilyDetailsContainer';

const IpFamilyDetailsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpFamilyDetailsContainer />
    </Authenticated>
  );
};

IpFamilyDetailsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout>{page}</IpAppNavigationLayout>
);

export default IpFamilyDetailsPage;
