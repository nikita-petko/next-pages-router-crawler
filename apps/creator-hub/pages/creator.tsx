import type { NextLayoutPage } from 'next';
import { useTranslation, withTranslation } from '@rbx/intl';
import { UIThemeProvider, makeStyles } from '@rbx/ui';
import DeveloperContainer from '@modules/landing/developerLanding/components/DeveloperContainer';
import DeveloperLandingHead from '@modules/landing/developerLanding/components/DeveloperLandingHead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { alpha } from '@modules/miscellaneous/utils';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';

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
    <>
      <DeveloperLandingHead />
      <UIThemeProvider theme='dark'>
        <BasicLayout classes={styles} isReady={ready} showNotificationTray={false}>
          <DeveloperContainer />
        </BasicLayout>
      </UIThemeProvider>
    </>
  );
};

Creator.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
export default withTranslation(Creator, [TranslationNamespace.UnifiedNavigation]);
