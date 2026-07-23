import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
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
  <IpAppNavigationLayout
    defaultTitle={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.IPLibrary' />
    }>
    {page}
  </IpAppNavigationLayout>
);
IpFamiliesPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpFamiliesPage;
