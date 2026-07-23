import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function RightsRepSection() {
  const { ready, translate } = useTranslation();
  const { control, formState } = useFormContext();
  const { errors } = formState;
  const [legalNameFocused, setLegalNameFocused] = useState(false);
  const [accountNameFocused, setAccountNameFocused] = useState(false);

  if (!ready) {
    return null;
  }

  return (
    <>
      <Grid item width='100%'>
        <Controller
          name='legalName'
          control={control}
          rules={{
            required: translate('Label.LegalNameIsRequired'),
            validate: {
              maxLength: (name: string) => {
                return name?.length < 200 || translate('Label.LegalNameIsLong');
              },
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete='off'
              fullWidth
              error={!!errors.legalName}
              required
              onBlur={() => setLegalNameFocused(false)}
              onFocus={() => setLegalNameFocused(true)}
              id='legalNameTextField'
              label={translate('Label.YourFullName')}
              helperText={
                (errors.legalName?.message as string) ||
                (legalNameFocused && translate('Description.ThisIsYourFullLegalName'))
              }
            />
          )}
        />
      </Grid>
      <Grid item width='100%'>
        <Controller
          name='accountName'
          control={control}
          rules={{
            required: translate('Label.OrgNameIsRequired'),
            validate: {
              maxLength: (name: string) => {
                return name?.length < 200 || translate('Label.OrgNameIsLong');
              },
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete='off'
              fullWidth
              error={!!errors.accountName}
              required
              onBlur={() => setAccountNameFocused(false)}
              onFocus={() => setAccountNameFocused(true)}
              id='accountNameTextField'
              label={translate('Label.OrgOrClientName')}
              helperText={
                (errors.accountName?.message as string) ||
                (accountNameFocused && translate('Description.OrgName'))
              }
            />
          )}
        />
      </Grid>
    </>
  );
}

export default withTranslation(RightsRepSection, [TranslationNamespace.RightsPortal]);
