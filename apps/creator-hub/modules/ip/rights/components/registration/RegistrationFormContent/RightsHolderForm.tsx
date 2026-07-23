import { Controller, useFormContext } from 'react-hook-form';
import { AccountAccountTypeEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Select, MenuItem, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IndividualSection from './IndividualSection';
import RightsRepSection from './RightsRepSection';

function RightsHolderForm({ accountType }: { accountType?: AccountAccountTypeEnum }) {
  const { ready, translate } = useTranslation();
  const { control, formState } = useFormContext();
  const { errors } = formState;

  if (!ready) {
    return null;
  }

  return (
    <Grid container spacing={3} minWidth='400px' width='100%'>
      <Grid item container direction='column' width='100%' spacing={3}>
        <Grid item>
          <Typography variant='h3'>{translate('Heading.RightsHolder')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1'>{translate('Description.RightsHolder')}</Typography>
        </Grid>
      </Grid>
      <Grid item width='100%'>
        <Controller
          name='accountType'
          control={control}
          rules={{
            required: translate('Label.RightsHolderTypeIsRequired'),
          }}
          render={({ field }) => (
            <Select
              {...field}
              sx={{ width: '100%' }}
              error={!!errors.accountType}
              required
              id='typeSelect'
              label={translate('Label.RightsHolderType')}>
              <MenuItem value={AccountAccountTypeEnum.Individual}>
                {translate('Label.RightsHolderIndividual')}
              </MenuItem>
              <MenuItem value={AccountAccountTypeEnum.Corporate}>
                {translate('Label.RightsHolderCorporate')}
              </MenuItem>
            </Select>
          )}
        />
      </Grid>
      {accountType &&
        (accountType === AccountAccountTypeEnum.Corporate ? (
          <RightsRepSection />
        ) : (
          <IndividualSection />
        ))}
    </Grid>
  );
}

export default withTranslation(RightsHolderForm, [TranslationNamespace.RightsPortal]);
