import { FunctionComponent } from 'react';
import { Grid, Link, makeStyles, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AffiliateProgramChecks from './AffiliateProgramChecks';
import { creatorRewardsLandingPage } from '../constants/links';

export const useAffiliateProgramStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
  },
  headingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bodyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
}));

const AffiliateProgram: FunctionComponent = () => {
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();

  const { classes } = useAffiliateProgramStyles();

  const isLoading = !areTranslationsReady;

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <Grid container className={classes.container}>
      <Grid item container className={classes.headingContainer}>
        <Grid item>
          <Typography variant='body1' component='p'>
            {translateHTML('Description.CreatorRewardsAudienceExpansionEligibilityWithLink', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={creatorRewardsLandingPage} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
      </Grid>
      <Grid item container direction='column' className={classes.bodyContainer}>
        <Grid item>
          <Typography variant='h2' component='h2'>
            {translate('Heading.Prerequisites')}
          </Typography>
        </Grid>
        <AffiliateProgramChecks />
      </Grid>
    </Grid>
  );
};

export default withTranslation(AffiliateProgram, [
  TranslationNamespace.CreatorRewards,
  TranslationNamespace.AffiliateProgram,
  TranslationNamespace.Error,
]);
