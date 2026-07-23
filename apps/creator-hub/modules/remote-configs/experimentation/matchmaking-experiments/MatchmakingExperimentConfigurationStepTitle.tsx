import { Grid, Typography } from '@rbx/ui';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { SetupStepFormData } from '../types/FormData';

const MatchmakingExperimentConfigurationStepTitle = () => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { control } = useFormContext<SetupStepFormData>();

  const exposurePercent = useWatch({
    control,
    name: 'exposurePercent',
  });

  return (
    <Grid container direction='column' alignItems='flex-start' gap='4px'>
      <Grid item>
        <Typography variant='h6'>
          {translate(
            translationKey(
              'Title.ExperimentCreation.Variants',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='body1'>
          {translateHTML(
            translationKey(
              'Message.MatchmakingVariantsEqualSplit',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            [
              {
                opening: 'boldStart',
                closing: 'boldEnd',
                content(chunks: React.ReactNode) {
                  return <strong>{chunks}</strong>;
                },
              },
            ],
            { exposurePercent: `${exposurePercent}` },
          )}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default MatchmakingExperimentConfigurationStepTitle;
