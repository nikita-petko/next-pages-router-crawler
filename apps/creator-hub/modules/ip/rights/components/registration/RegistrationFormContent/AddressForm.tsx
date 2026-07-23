import React from 'react';
import { Grid, TextField, Typography, Autocomplete } from '@rbx/ui';
import { Controller, FieldError, useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface AddressFormProps {
  countries: string[];
}

function AddressForm({ countries }: AddressFormProps) {
  const { ready, translate } = useTranslation();
  const { control, formState } = useFormContext();
  const { errors } = formState;

  if (!ready) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={3} minWidth='400px' width='100%'>
      <Grid item container direction='column' XSmall spacing={3}>
        <Grid item>
          <Typography variant='h3'>{translate('Heading.Address')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1'>{translate('Description.AddressRequired')}</Typography>
        </Grid>
      </Grid>
      <Grid item XSmall>
        <Controller
          name='country'
          control={control}
          rules={{
            validate: {
              required: (option: { name: string }) => {
                return !!option?.name || translate('Label.CountryIsRequired');
              },
            },
          }}
          render={({ field }) => (
            <Autocomplete
              {...field}
              value={field.value || null}
              onChange={(_, value) => {
                field.onChange(value);
              }}
              autoComplete
              autoHighlight
              isOptionEqualToValue={(option, value) => option.name === value.name}
              options={countries.map((country) => {
                return {
                  name: country,
                };
              })}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!!errors.country}
                  fullWidth
                  required
                  id='countryTextField'
                  label={translate('Label.Country')}
                  helperText={errors.country && (errors.country as FieldError).message}
                />
              )}
            />
          )}
        />
      </Grid>
      <Grid item XSmall>
        <Controller
          name='address'
          control={control}
          rules={{
            required: translate('Label.AddressIsRequired'),
            validate: {
              maxLength: (input: string) => {
                return input?.length < 200 || translate('Label.AddressIsLong');
              },
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete='off'
              error={!!errors.address}
              fullWidth
              required
              id='addressTextField'
              label={translate('Label.AddressLine1')}
              helperText={errors.address?.message as string}
            />
          )}
        />
      </Grid>
      <Grid item XSmall>
        <Controller
          name='address2'
          control={control}
          rules={{
            validate: {
              maxLength: (input: string) => {
                return input?.length < 100 || translate('Label.Address2IsLong');
              },
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete='off'
              error={!!errors.address2}
              fullWidth
              id='address2TextField'
              label={translate('Label.AddressLine2Optional')}
              helperText={errors.address2?.message as string}
            />
          )}
        />
      </Grid>
      <Grid item XSmall>
        <Controller
          name='city'
          control={control}
          rules={{
            required: translate('Label.CityIsRequired'),
            validate: {
              maxLength: (input: string) => {
                return input?.length < 200 || translate('Label.CityIsLong');
              },
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete='off'
              error={!!errors.city}
              fullWidth
              required
              id='cityTextField'
              label={translate('Label.City')}
              helperText={errors.city?.message as string}
            />
          )}
        />
      </Grid>
      <Grid item container>
        <Grid XSmall={6} item paddingRight={2}>
          <Controller
            name='state'
            control={control}
            rules={{
              required: translate('Label.StateIsRequired'),
              validate: {
                maxLength: (input: string) => {
                  return input?.length < 200 || translate('Label.StateIsLong');
                },
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                autoComplete='off'
                error={!!errors.state}
                fullWidth
                required
                id='stateTextField'
                label={translate('Label.State')}
                helperText={errors.state?.message as string}
              />
            )}
          />
        </Grid>
        <Grid XSmall={6} item>
          <Controller
            name='postalCode'
            control={control}
            rules={{
              required: translate('Label.ZipIsRequired'),
              validate: {
                maxLength: (input: string) => {
                  return input?.length < 200 || translate('Label.ZipIsLong');
                },
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                autoComplete='off'
                error={!!errors.postalCode}
                fullWidth
                required
                id='postalCodeTextField'
                label={translate('Label.Zip')}
                helperText={errors.postalCode?.message as string}
              />
            )}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default withTranslation(AddressForm, [TranslationNamespace.RightsPortal]);
