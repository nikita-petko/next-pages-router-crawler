import type { NextLayoutPage } from 'next';
import { HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { UIThemeProvider, makeStyles } from '@rbx/ui';
import metadataConstants from '@modules/creator-rewards-landing/landing/constants';
import CreatorRewardsLanding from '@modules/creator-rewards-landing/landing/CreatorRewardsLanding';
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

const CreatorRewardsLandingPage: NextLayoutPage = () => {
  const { ready, translate } = useTranslation();
  const { classes: styles } = useStyles();

  return (
    <>
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
    </>
  );
};

CreatorRewardsLandingPage.loggerConfig = { rosId: RosTeams.GameOperations };
export default withTranslation(CreatorRewardsLandingPage, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.CreatorRewardsLanding,
]);
