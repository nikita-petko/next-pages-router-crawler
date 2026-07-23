import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpFamiliesContainer from '@modules/ip/ipFamilies/containers/IpFamiliesContainer';

const IpFamiliesPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpFamiliesContainer />
    </Authenticated>
  );
};

IpFamiliesPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout defaultTitle='Heading.IPLibrary'>{page}</IpAppNavigationLayout>
);

export default IpFamiliesPage;
