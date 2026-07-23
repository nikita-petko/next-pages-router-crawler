import { FormattedText } from '@modules/analytics-translations';
import { Checkbox, FormControlLabel, Grid, Radio, Typography, makeStyles } from '@rbx/ui';
import React from 'react';

const useChoiceStyles = makeStyles()(() => ({
  choiceOption: {
    padding: '4px 8px',
  },
  choiceOptionLabel: {
    width: '180px',
    padding: '0 4px',
  },
}));

type SingleValueInCategoryChoiceProps<T extends string> = {
  option: T;
  current: T[];
  onChange: (newValue: T[]) => void;
  formatOption: (option: T) => FormattedText;
  multiple?: boolean;
};

/**
 * SingleValueInCategoryChoice is forked from the charts-generic module's EnumValueImpl component
 * It represents one check or radio option
 */
const SingleValueInCategoryChoice = function SingleValueInCategoryChoice<T extends string>({
  option,
  current,
  onChange,
  formatOption,
  multiple,
}: SingleValueInCategoryChoiceProps<T>) {
  const {
    classes: { choiceOptionLabel, choiceOption },
  } = useChoiceStyles();
  const text = formatOption(option);

  const Control = multiple ? Checkbox : Radio;
  const controlTestId = multiple ? 'filter-drawer-enum-checkbox' : 'filter-drawer-enum-radio';
  return (
    <Grid item className={choiceOption}>
      <FormControlLabel
        classes={{ label: choiceOptionLabel }}
        key={option}
        control={
          <Control
            data-testid={controlTestId}
            color='secondary'
            size='medium'
            checked={current.includes(option)}
            onChange={(event) => {
              if (event.target.checked) {
                onChange(multiple ? [...current, option] : [option]);
              } else {
                onChange(current.filter((c) => c !== option));
              }
            }}
            aria-label={text}
          />
        }
        label={
          <Typography
            noWrap
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant='smallLabel2'
            display='block'>
            {text}
          </Typography>
        }
      />
    </Grid>
  );
};
export default SingleValueInCategoryChoice;
