import React, { useMemo } from 'react';
import { Grid, Alert, AlertTitle, Typography, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link, urls } from '@modules/miscellaneous/common';

const SRMBanner = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const action = useMemo(() => {
    return (
      <Link href={urls.creatorHub.docs.getExperimentationUrl()} target='_blank'>
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
