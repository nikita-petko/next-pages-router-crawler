import React, { useCallback, useEffect, useRef } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import { useFilterDrawerEventEmitterContext } from '../../context/FilterDrawerEventEmitterContext';
import FilterChoiceWrapper from './FilterChoiceWrapper';
import { usePendingDialogState } from './DialogEventEmitter';
import FilterStringChoice, { BlankHandlingConfig } from '../FilterStringChoice';

export interface FilterDrawerStringChoiceProps<T> {
  name: FormattedText;
  multiple?: boolean;
  isLoading?: boolean;
  initial: T[];
  formatOption: 'literal' | ((option: T) => FormattedText);
  options: T[];
  onChangeSubmit?: (newValue: T[]) => void;
  blankHandling?: BlankHandlingConfig<T>;
  helperText?: React.ReactNode;
  overrideSignal?: T[];
}

function FilterDrawerStringChoice<T extends string>({
  name,
  multiple,
  isLoading,
  initial,
  options,
  formatOption,
  onChangeSubmit,
  blankHandling,
  helperText,
  overrideSignal,
}: FilterDrawerStringChoiceProps<T>) {
  const emitter = useFilterDrawerEventEmitterContext();
  const [current, setCurrent] = usePendingDialogState(
    initial,
    emitter,
    onChangeSubmit,
    overrideSignal,
  );

  // when loading completes, reset current selected values to initial
  const wasLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setCurrent(initial);
    }
    wasLoadingRef.current = isLoading;
  }, [initial, isLoading, setCurrent]);

  const onChange = useCallback(
    (newValue: T[]) => {
      setCurrent(newValue);
    },
    [setCurrent],
  );

  return (
    <FilterChoiceWrapper name={name}>
      <FilterStringChoice
        label={undefined}
        selectedOptions={current}
        options={isLoading ? initial : options}
        isLoading={isLoading}
        multiple={multiple}
        blankHandling={blankHandling}
        helperText={helperText}
        formatOption={formatOption}
        onChange={onChange}
      />
    </FilterChoiceWrapper>
  );
}

export default FilterDrawerStringChoice;
