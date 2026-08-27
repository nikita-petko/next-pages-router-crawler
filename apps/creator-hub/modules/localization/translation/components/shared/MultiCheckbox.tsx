import type { ReactElement } from 'react';
import React from 'react';
import { Checkbox, FormControlLabel, Typography } from '@rbx/ui';
import useMultiCheckboxStyles from './MultiCheckbox.styles';

export interface MultiCheckboxProps<TFilterOption extends string> {
  checkedValues: Array<TFilterOption>;
  allowedValues: Array<TFilterOption>;
  getLabel: (value: TFilterOption) => string;
  setCheckedValues: (checkedValues: Array<TFilterOption>) => void;
}

const MultiCheckbox = <TFilterOption extends string>({
  checkedValues,
  allowedValues,
  getLabel,
  setCheckedValues,
}: MultiCheckboxProps<TFilterOption>): ReactElement => {
  const {
    classes: { spacing, checkbox, checkboxContainer },
  } = useMultiCheckboxStyles();

  const handleToggle = (checkedValue: TFilterOption, isChecked: boolean) => {
    const newCheckedValues = new Set(checkedValues);
    if (isChecked) {
      newCheckedValues.add(checkedValue);
    } else {
      newCheckedValues.delete(checkedValue);
    }
    setCheckedValues(Array.from(newCheckedValues));
  };

  return (
    <>
      {allowedValues?.map((allowedValue) => {
        return (
          <FormControlLabel
            classes={{ labelPlacementStart: spacing }}
            className={checkboxContainer}
            key={allowedValue}
            value={allowedValue}
            labelPlacement='start'
            control={
              <Checkbox
                className={checkbox}
                color='secondary'
                size='small'
                checked={checkedValues.includes(allowedValue)}
                onChange={(event) => handleToggle(allowedValue, event.target.checked)}
                name={allowedValue}
              />
            }
            label={<Typography variant='captionBody'>{getLabel(allowedValue)}</Typography>}
          />
        );
      })}
    </>
  );
};

export default MultiCheckbox;
