import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useEffect } from 'react';
import { TextInput, Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Label, Typography } from '@rbx/ui';
import type { NumberRange } from '../../../../types/GameServerControls';
import styles from './NumberRangeSection.module.css';

export interface NumberRangeProps {
  label: string;
  setRange: (range: NumberRange) => void;
  currentRange: NumberRange;
  isInvalid?: (error: boolean) => void;
  placeholderBounds?: { min: number; max: number };
  integerOnly?: boolean;
}

const isNumericInput = (value: string) => value === '' || /^\d*\.?\d*$/.test(value);
const isIntegerInput = (value: string) => value === '' || /^\d*$/.test(value);

const NumberRangeSection: FunctionComponent<NumberRangeProps> = ({
  label,
  setRange,
  currentRange,
  isInvalid,
  placeholderBounds,
  integerOnly = false,
}) => {
  const { translate } = useTranslation();

  const [minInput, setMinInput] = useState(currentRange?.min?.toString() ?? '');
  const [maxInput, setMaxInput] = useState(currentRange?.max?.toString() ?? '');
  const [hasError, setHasError] = useState(false);

  const hasInput = currentRange?.min !== undefined || currentRange?.max !== undefined;
  const minPlaceholder =
    !hasInput && placeholderBounds ? placeholderBounds.min.toString() : undefined;
  const maxPlaceholder =
    !hasInput && placeholderBounds ? placeholderBounds.max.toString() : undefined;

  const validateInput = (value: string) =>
    integerOnly ? isIntegerInput(value) : isNumericInput(value);

  const setError = useCallback(
    (error: boolean) => {
      setHasError(error);
      if (isInvalid) {
        isInvalid(error);
      }
    },
    [setHasError, isInvalid],
  );

  const setRangeValue = useCallback(
    (minStr: string, maxStr: string) => {
      const min = minStr === '' ? undefined : parseFloat(minStr);
      const max = maxStr === '' ? undefined : parseFloat(maxStr);
      const hasRangeError = min !== undefined && max !== undefined && min > max;
      setError(hasRangeError);
      setRange({ min, max });
      setMinInput(minStr);
      setMaxInput(maxStr);
    },
    [setRange, setError],
  );

  // Sync local state
  useEffect(() => {
    setRangeValue(currentRange?.min?.toString() ?? '', currentRange?.max?.toString() ?? '');
  }, [currentRange?.min, currentRange?.max, setRangeValue]);

  return (
    <Grid container className='flex flex-col gap-xsmall'>
      <Grid item>
        <Typography variant='captionHeader'>{label}</Typography>
      </Grid>
      <Grid item container className='flex flex-row no-wrap items-center gap-xsmall'>
        <Grid item>
          <TextInput
            value={minInput}
            onChange={(e) => {
              if (validateInput(e.target.value)) {
                setRangeValue(e.target.value, maxInput);
              }
            }}
            size='Small'
            inputContainerClassName='max-width-1800'
            className={styles.tightOutline}
            inputMode={integerOnly ? 'numeric' : 'decimal'}
            hasError={hasError}
            placeholder={minPlaceholder}
          />
        </Grid>
        <Grid item>
          <Label labelText='-' variant='text' />
        </Grid>
        <Grid item>
          <TextInput
            value={maxInput}
            onChange={(e) => {
              if (validateInput(e.target.value)) {
                setRangeValue(minInput, e.target.value);
              }
            }}
            size='Small'
            inputContainerClassName='max-width-1800'
            className={styles.tightOutline}
            inputMode={integerOnly ? 'numeric' : 'decimal'}
            hasError={hasError}
            placeholder={maxPlaceholder}
          />
        </Grid>
      </Grid>
      <Grid item>
        <Button size='Small' variant='Utility' onClick={() => setRangeValue('', '')}>
          {translate('ServerListTable.Filter.ResetNumberRange')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default NumberRangeSection;
