/* istanbul ignore file */
import { Grid, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import FiatPaidAccessChecks from '../../components/PaidAccessChecks/PaidAccessChecks';
import useFiatPaidAccessStyles from './FiatPaidAccessPageContentStyles';

const FiatPaidAccessPageContent = () => {
  const { ready: areTranslationsReady, translate } = useTranslation();

  const { classes } = useFiatPaidAccessStyles();

  if (!areTranslationsReady) {
    return <PageLoading />;
  }

  return (
    <Grid container className={classes.container}>
      <Grid item container className={classes.headingContainer}>
        <Grid item>
          <Typography variant='body1' component='p'>
            {translate('Description.PaidAccessFiatPrerequisites')}
          </Typography>
        </Grid>
      </Grid>
      <Grid item container direction='column' className={classes.bodyContainer}>
        <Grid item>
          <Typography variant='h2' component='h2'>
            {translate('Heading.Prerequisites')}
          </Typography>
        </Grid>
        <FiatPaidAccessChecks />
      </Grid>
    </Grid>
  );
};

export default withTranslation(FiatPaidAccessPageContent, [
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.Error,
]);
