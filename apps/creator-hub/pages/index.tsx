import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import HomeContainer from '@modules/home/components/HomeContainer';
import { NextLayoutPage } from 'next';
import LandingHead from '@modules/landing/sections/components/LandingHead';

const getHomePageLayout = (page: ReactNode) => (
  <IALayoutExperiment product='Home' title='Heading.Home' noBreadCrumbs>
    <LandingHead />
    {page}
  </IALayoutExperiment>
);

const Home: NextLayoutPage = () => {
  return <HomeContainer />;
};

Home.getPageLayout = getHomePageLayout;
export default Home;
