import { memo, useCallback } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Card, SearchIcon, InputAdornment, Autocomplete, TextField } from '@rbx/ui';
import useGetSupportedCountries from '../../../queries/useGetSupportedCountries';
import { priceValidationSchema } from '../schemas';
import type { PriceValidationFormValues, Country } from '../types';
import useTestConfigurationSelectionStyles from './TestConfigurationSelection.styles';

type LocationPinningSubselectionProps = {
  disabled?: boolean;
};

const descriptionId = 'location-pinning-select-country-description';

function LocationPinningSubselection({ disabled }: LocationPinningSubselectionProps) {
  const { translate } = useTranslation();
  const { classes } = useTestConfigurationSelectionStyles();

  const { data: countries = [], isPending } = useGetSupportedCountries();

  const {
    field: { value: selectedCountry, name, onChange },
  } = useController<PriceValidationFormValues, 'location'>({
    name: 'location',
    rules: priceValidationSchema.location,
  });

  const handleChange = useCallback(
    (_: React.SyntheticEvent, value: Country | null) => {
      // Note: clearing / no selection defaults to `null` by default
      onChange(value);
    },
    [onChange],
  );

  return (
    <Card className={classes.subselection}>
      <Typography variant='h5' component='h4'>
        {translate('Heading.LocationPinningSubselection')}
      </Typography>
      <Typography id={descriptionId} variant='body1' component='p'>
        {translate('Description.LocationPinningSubselection')}
      </Typography>

      <Autocomplete
        loading={isPending}
        className={classes.search}
        getOptionLabel={(option) => option.displayName}
        options={countries}
        autoSelect
        autoComplete
        autoHighlight
        value={selectedCountry}
        isOptionEqualToValue={(option, value) =>
          option.code === value.code || option.displayName === value.displayName
        }
        onChange={handleChange}
        disabled={disabled}
        fullWidth
        aria-describedby={descriptionId}
        noOptionsText={translate('Label.NoLocationOptions')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={translate('Label.LocationAutocomplete')}
            InputProps={{
              ...params.InputProps,
              name,
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon color='disabled' />
                </InputAdornment>
              ),
              placeholder: translate('Label.LocationAutocompletePlaceholder'),
            }}
          />
        )}
      />
    </Card>
  );
}

export default memo(LocationPinningSubselection);
