import React, { FunctionComponent, useEffect } from 'react';
import DeveloperOverview from './DeveloperOverview';
import Hero from './Hero';
import DeveloperExperiences from './DeveloperExperiences';
import Community from './Community';
import CreatorHub from './CreatorHub';
import Studio from './Studio';
import Latest from './Latest';
import Creating from './Creating';
import Business from './Business';
import useDeveloperContainerStyles from './DeveloperContainer.styles';
import { captureDeveloperLandingImpression } from '../utils/eventUtils';

const DeveloperContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root, fullWidthContainer },
  } = useDeveloperContainerStyles();

  useEffect(() => {
    captureDeveloperLandingImpression();
  }, []);

  return (
    <div className={root}>
      <div className={fullWidthContainer}>
        <Hero />
        <DeveloperExperiences />
      </div>
      <DeveloperOverview />
      <Business />
      <Community />
      <Studio />
      <CreatorHub />
      <Latest />
      <div className={fullWidthContainer}>
        <Creating />
      </div>
    </div>
  );
};

export default DeveloperContainer;
