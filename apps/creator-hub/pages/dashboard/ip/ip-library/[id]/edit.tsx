import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpFamilyEditContainer from '@modules/ip/ipFamilies/containers/IpFamilyEditContainer';

const IpFamilyEditPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpFamilyEditContainer />
    </Authenticated>
  );
};

IpFamilyEditPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>
);
IpFamilyEditPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpFamilyEditPage;
