import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import HomeContainer from '@modules/home/components/HomeContainer';
import LandingHead from '@modules/landing/sections/components/LandingHead';

const getHomePageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    product='Home'
    title={<Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Home' />}
    noBreadCrumbs>
    <LandingHead />
    {page}
  </CreatorHubLayout>
);

const Home: NextLayoutPage = () => {
  return <HomeContainer />;
};

Home.getPageLayout = getHomePageLayout;
Home.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
export default Home;
