import React from 'react';
import { UIThemeProvider, makeStyles } from '@rbx/ui';
import { NextLayoutPage } from 'next';
import DeveloperContainer from '@modules/landing/developerLanding/components/DeveloperContainer';
import DeveloperLandingHead from '@modules/landing/developerLanding/components/DeveloperLandingHead';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { utils } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';

const { alpha } = utils;
const useStyles = makeStyles()((theme) => ({
  header: {
    position: 'fixed',
    backgroundColor: alpha(theme.palette.content.static.dark, 120),
    backdropFilter: 'blur(5px)',
  },
}));

const Creator: NextLayoutPage = () => {
  const { ready } = useTranslation();
  const { classes: styles } = useStyles();

  return (
    <React.Fragment>
      <DeveloperLandingHead />
      <UIThemeProvider theme='dark'>
        <BasicLayout classes={styles} isReady={ready}>
          <DeveloperContainer />
        </BasicLayout>
      </UIThemeProvider>
    </React.Fragment>
  );
};

export default withTranslation(Creator, [
  TranslationNamespace.DeveloperLanding,
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
]);
