import { Fragment, memo, useCallback } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Radio, RadioGroup, Grid, FormHelperText, FormLabel } from '@rbx/ui';
import { priceValidationSchema } from '../schemas';
import type { PriceValidationFormValues, TestingType } from '../types';
import LocationPinningSubselection from './LocationPinningSubselection';
import PricePinningSubselection from './PricePinningSubselection';
import useTestConfigurationSelectionStyles from './TestConfigurationSelection.styles';

type TestConfigurationSelectionProps = {
  disabled?: boolean;
};

const TESTING_TYPE_OPTIONS = [
  {
    id: 'price-pinned',
    value: 'price' satisfies TestingType,
    label: 'Label.PricePinnedOption',
    ariaLabel: 'Label.PricePinnedOptionAria',
    caption: 'Description.PricePinnedOption',
    captionId: 'price-pinned-caption',
    Subselection: PricePinningSubselection,
  },
  {
    id: 'location-pinned',
    value: 'location' satisfies TestingType,
    label: 'Label.LocationPinnedOption',
    ariaLabel: 'Label.LocationPinnedOptionAria',
    caption: 'Description.LocationPinnedOption',
    captionId: 'location-pinned-caption',
    Subselection: LocationPinningSubselection,
  },
] as const;

function TestConfigurationSelection({ disabled }: TestConfigurationSelectionProps) {
  const { translate } = useTranslation();
  const { classes, cx } = useTestConfigurationSelectionStyles();

  const {
    // Set initial value to null when undefined (from async init) to prevent uncontrolled radiogroup
    field: { value: selectedType, name, onChange },
  } = useController<PriceValidationFormValues, 'testing'>({
    name: 'testing',
    rules: priceValidationSchema.testing,
  });

  const handleChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, v: string) => {
      onChange(v);
    },
    [onChange],
  );

  return (
    <RadioGroup
      className={classes.testRadioGroup}
      name={name}
      value={selectedType ?? null}
      onChange={handleChange}>
      {TESTING_TYPE_OPTIONS.map(({ Subselection, ...option }) => (
        <Fragment key={option.label}>
          <Grid className={classes.testRadioGrid}>
            <span>
              <Radio
                id={option.id}
                value={option.value}
                aria-label={translate(option.ariaLabel)}
                aria-describedby={option.captionId}
                color='secondary'
                disabled={disabled}
              />
            </span>

            <FormLabel
              htmlFor={option.id}
              disabled={disabled}
              className={cx(classes.testRadioLabel, disabled && classes.disabled)}>
              <Typography
                variant='body1'
                component='span'
                color={disabled ? 'secondary' : 'primary'}>
                {translate(option.label)}
              </Typography>
              <FormHelperText id={option.captionId} disabled={disabled}>
                {translate(option.caption)}
              </FormHelperText>
            </FormLabel>
          </Grid>

          {selectedType === option.value && <Subselection disabled={disabled} />}
        </Fragment>
      ))}
    </RadioGroup>
  );
}

export default memo(TestConfigurationSelection);
