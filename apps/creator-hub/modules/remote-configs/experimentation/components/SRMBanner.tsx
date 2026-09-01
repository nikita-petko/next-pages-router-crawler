import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Alert, AlertTitle, Typography, Button } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

const SRMBanner = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const action = useMemo(() => {
    return (
      <Link href={creatorHub.docs.getExperimentationUrl()} target='_blank'>
        <Button variant='contained' color='secondary'>
          {translate(
            translationKey(
              'Label.LearnMore',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </Link>
    );
  }, [translate]);

  return (
    <Grid container item XSmall={12}>
      <Alert variant='standard' severity='error' action={action}>
        <AlertTitle>
          {translate(
            translationKey(
              'Title.SRMBanner',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </AlertTitle>
        <Typography component='div' marginTop='6px' variant='smallLabel1'>
          {translate(
            translationKey(
              'Description.SRMBanner',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
      </Alert>
    </Grid>
  );
};

export default SRMBanner;
