import React from 'react';
import { UIThemeProvider, makeStyles } from '@rbx/ui';
import { NextLayoutPage } from 'next';
import DeveloperLandingHead from '@modules/landing/developerLanding/components/DeveloperLandingHead';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';
import { utils } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import CreatorRewardsLanding from '@modules/creator-rewards-landing/landing/CreatorRewardsLanding';
import metadataConstants from '@modules/creator-rewards-landing/landing/constants';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { HubMeta } from '@rbx/creator-hub-history';

const { alpha } = utils;
const useStyles = makeStyles()((theme) => ({
  header: {
    position: 'fixed',
    backgroundColor: alpha(theme.palette.content.static.dark, 120),
    backdropFilter: 'blur(5px)',
  },
}));

const CreatorRewardsLandingPage: NextLayoutPage = () => {
  const { ready, translate } = useTranslation();
  const { classes: styles } = useStyles();

  return (
    <React.Fragment>
      <DeveloperLandingHead />
      <UIThemeProvider theme='dark'>
        <HubMeta
          title={translate('Title.CreatorRewards')}
          ogTitle={metadataConstants.title}
          description={metadataConstants.description}
        />
        <BasicLayout classes={styles} isReady={ready}>
          <CreatorRewardsLanding />
        </BasicLayout>
      </UIThemeProvider>
    </React.Fragment>
  );
};

export default withTranslation(CreatorRewardsLandingPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.CreatorRewardsLanding,
]);
