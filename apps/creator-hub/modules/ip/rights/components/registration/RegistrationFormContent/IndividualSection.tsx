import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function IndividualSection() {
  const { ready, translate } = useTranslation();
  const { control, formState } = useFormContext();
  const { errors } = formState;
  const [legalNameFocused, setLegalNameFocused] = useState(false);

  if (!ready) {
    return null;
  }

  return (
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
            label={translate('Label.YourFullNameNotSharedDisclosure')}
            helperText={
              (errors.legalName?.message as string) ||
              (legalNameFocused && translate('Description.ThisIsYourFullLegalName'))
            }
          />
        )}
      />
    </Grid>
  );
}

export default withTranslation(IndividualSection, [
  TranslationNamespace.RightsPortal,
  TranslationNamespace.AgreementsManager,
]);
