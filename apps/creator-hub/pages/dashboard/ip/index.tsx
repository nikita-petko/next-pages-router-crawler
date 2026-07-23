import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpLandingRedirect from '@modules/ip/containers/IpLandingRedirect';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';

const IpLanding: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpLandingRedirect />
    </Authenticated>
  );
};

IpLanding.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout>{page}</IpAppNavigationLayout>
);
IpLanding.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpLanding;
