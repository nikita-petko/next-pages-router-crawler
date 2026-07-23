import type { ChangeEvent, FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Checkbox, FormControlLabel, Typography } from '@rbx/ui';
import { filterOptionsLabelMap, filterOptionsStringEnumMap } from '../constants';
import type EntryFilterOptions from '../enums/EntryFilterOptions';
import useMultiCheckboxStyles from './MultiCheckbox.styles';

export interface MultiCheckboxProps {
  checkedValues: Array<EntryFilterOptions>;
  allowedValues: Array<EntryFilterOptions>;
  setCheckedValues: (checkedValues: Array<EntryFilterOptions>) => void;
}

const MultiCheckbox: FunctionComponent<React.PropsWithChildren<MultiCheckboxProps>> = ({
  checkedValues,
  allowedValues,
  setCheckedValues,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { spacing, checkbox, checkboxContainer },
  } = useMultiCheckboxStyles();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checkedValue = event.target.name;
    const newCheckedValues = new Set(checkedValues);
    if (event.target.checked) {
      newCheckedValues.add(filterOptionsStringEnumMap[checkedValue]);
    } else {
      newCheckedValues.delete(filterOptionsStringEnumMap[checkedValue]);
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
            key={allowedValue as string}
            value={allowedValue}
            labelPlacement='start'
            control={
              <Checkbox
                className={checkbox}
                color='secondary'
                size='small'
                checked={checkedValues.includes(allowedValue)}
                onChange={handleChange}
                name={allowedValue as string}
              />
            }
            label={
              <Typography variant='captionBody'>
                {translate(filterOptionsLabelMap[allowedValue])}
              </Typography>
            }
          />
        );
      })}
    </>
  );
};

export default MultiCheckbox;
