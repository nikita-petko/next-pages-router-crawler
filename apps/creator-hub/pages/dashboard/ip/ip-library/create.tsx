import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpFamilyCreateContainer from '@modules/ip/ipFamilies/containers/IpFamilyCreateContainer';

const IpFamilyCreatePage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpFamilyCreateContainer />
    </Authenticated>
  );
};

IpFamilyCreatePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout>{page}</IpAppNavigationLayout>
);
IpFamilyCreatePage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpFamilyCreatePage;
