import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpContentsCreateContainer from '@modules/ip/ipFamilies/containers/IpContentsCreateContainer';

const IpContentsCreatePage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpContentsCreateContainer />
    </Authenticated>
  );
};

IpContentsCreatePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>
);

export default IpContentsCreatePage;
