import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { captureDeveloperLandingImpression } from '../utils/eventUtils';
import Business from './Business';
import Community from './Community';
import CreatorHub from './CreatorHub';
import useDeveloperContainerStyles from './DeveloperContainer.styles';
import DeveloperExperiences from './DeveloperExperiences';
import DeveloperOverview from './DeveloperOverview';
import Hero from './Hero';
import Latest from './Latest';
import Studio from './Studio';

const DeveloperContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { root, fullWidthContainer },
  } = useDeveloperContainerStyles();

  useEffect(() => {
    captureDeveloperLandingImpression();
  }, []);

  return (
    <div className={`${root} dark-theme`}>
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
    </div>
  );
};

export default withTranslation(DeveloperContainer, [
  TranslationNamespace.DeveloperLanding,
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.Landing,
]);
