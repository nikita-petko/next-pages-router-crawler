import { Fragment, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Autocomplete, Checkbox, Grid, Link, TextField, Typography } from '@rbx/ui';
import type { ExperienceAccessFormType, CountryInfo } from '../ExperienceAccessTypes';
import useExperienceAccessRegionStyles from './ExperienceAccessRegion.styles';

type Props = {
  methods: UseFormReturn<ExperienceAccessFormType>;
  enableCreatorControlsGeoGate: boolean;
  allCountries: CountryInfo[];
};

function ExperienceAccessRegion({
  methods: { control },
  enableCreatorControlsGeoGate,
  allCountries,
}: Props) {
  const {
    classes: {
      autocomplete,
      section,
      autocompletePopper,
      displayText,
      formHelperTextWarning,
      formHelperTextDefault,
    },
  } = useExperienceAccessRegionStyles();
  const { translate, translateHTML } = useTranslation();

  const [open, setOpen] = useState(false);

  return (
    <>
      {enableCreatorControlsGeoGate && (
        <Grid classes={{ root: section }}>
          <Typography variant='h2'>{translate('Heading.Region')}</Typography>
          <Typography variant='body2' color='secondary'>
            {translateHTML('Description.Region', [
              {
                opening: 'startLink',
                closing: 'endLink',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/publish-experiences-and-places#configure-experiences`}
                      target='_blank'
                      underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>

          <Grid item XSmall={12} classes={{ root: autocomplete }}>
            <Controller
              name='restrictedCountries'
              control={control}
              render={({ field }) => {
                const currentValue = allCountries.filter(
                  (country) => country.countryCode && !field.value?.includes(country.countryCode),
                );

                const allRegionsOption = {
                  countryCode: 'ALL',
                  countryName: translate('Label.AllRegions'),
                };
                const options = [allRegionsOption, ...allCountries];

                const isAllSelected = currentValue.length === allCountries.length;
                const isPartiallySelected =
                  currentValue.length > 0 && currentValue.length < allCountries.length;

                const displayValue = isAllSelected
                  ? [allRegionsOption, ...currentValue]
                  : currentValue;

                return (
                  <Autocomplete
                    open={open}
                    onOpen={() => setOpen(true)}
                    onClose={() => setOpen(false)}
                    multiple
                    options={options}
                    getOptionLabel={(option) => option.countryName}
                    isOptionEqualToValue={(option, value) =>
                      option.countryCode === value.countryCode
                    }
                    value={displayValue}
                    disableCloseOnSelect
                    disablePortal
                    classes={{ root: autocompletePopper }}
                    renderOption={(props, option, { selected }) => {
                      const isAllRegionsOption = option.countryCode === 'ALL';

                      if (isAllRegionsOption) {
                        return (
                          <li {...props}>
                            <Checkbox checked={isAllSelected} indeterminate={isPartiallySelected} />
                            {option.countryName}
                          </li>
                        );
                      }

                      return (
                        <li {...props}>
                          <Checkbox checked={selected} />
                          {option.countryName}
                        </li>
                      );
                    }}
                    renderInput={(params) => {
                      const numTags = currentValue.length;
                      const displayTextValue = (() => {
                        switch (numTags) {
                          case 0:
                            return translate('Label.RegionsNone');
                          case 1:
                            return currentValue[0].countryName;
                          case 2:
                            return translate('Label.RegionsTwo', {
                              firstCountry: currentValue[0].countryName,
                              secondCountry: currentValue[1].countryName,
                            });
                          case allCountries.length:
                            return translate('Label.RegionsAll');
                          default:
                            return translate('Label.RegionsMany', {
                              countryName: currentValue[0].countryName,
                              numCountries: (numTags - 1).toString(),
                            });
                        }
                      })();

                      return (
                        <TextField
                          {...params}
                          label={translate('Label.Regions')}
                          helperText={numTags === 0 ? translate('Message.NoRegions') : ''}
                          FormHelperTextProps={{
                            classes: {
                              root: numTags === 0 ? formHelperTextWarning : formHelperTextDefault,
                            },
                          }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <Typography noWrap classes={{ root: displayText }}>
                                {displayTextValue}
                              </Typography>
                            ),
                          }}
                        />
                      );
                    }}
                    onChange={(event, newValue) => {
                      const newAllSelected = newValue.some((item) => item.countryCode === 'ALL');

                      let restrictedCodes: string[];

                      if (newAllSelected !== isAllSelected) {
                        restrictedCodes = !newAllSelected
                          ? allCountries.map((country) => country.countryCode)
                          : [];
                      } else {
                        const allowedCountries = newValue.filter(
                          (item) => item.countryCode !== 'ALL',
                        );
                        const allowedCodes = new Set(
                          allowedCountries.map((country) => country.countryCode),
                        );
                        restrictedCodes = allCountries
                          .filter((country) => !allowedCodes.has(country.countryCode))
                          .map((country) => country.countryCode);
                      }

                      field.onChange(restrictedCodes);
                    }}
                  />
                );
              }}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default ExperienceAccessRegion;
