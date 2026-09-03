import type { ChangeEvent, FC } from 'react';
import { useCallback, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import {
  EMPTY_SESSION_BROWSER_NUMERIC_RANGE,
  type SessionBrowserDrawerFilters,
} from '../types/SessionBrowserFilters';
import { compactNumericRange } from '../utils/sessionBrowserFilters';

const DECIMAL_INPUT_PATTERN = /^\d*\.?\d*$/;

export type SessionBrowserNumericRangeFieldName = keyof Pick<
  SessionBrowserDrawerFilters,
  'deviceRamMegabytes' | 'durationMinutes' | 'minFps' | 'usedMemoryMegabytes'
>;

export type ClientSessionBrowserNumericRangeFieldProps = {
  readonly name: SessionBrowserNumericRangeFieldName;
  readonly label: FormattedText;
  readonly minPlaceholder: string;
  readonly maxPlaceholder: string;
  readonly unitSuffix?: string;
};

type NumericRangeBound = 'min' | 'max';

const toInputValue = (value: number | undefined): string =>
  value === undefined ? '' : String(value);

const parseInputValue = (rawValue: string): number | null => {
  if (rawValue === '' || rawValue === '.') {
    return null;
  }
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const ClientSessionBrowserNumericRangeField: FC<ClientSessionBrowserNumericRangeFieldProps> = ({
  name,
  label,
  minPlaceholder,
  maxPlaceholder,
  unitSuffix,
}) => {
  const { control } = useFormContext<SessionBrowserDrawerFilters>();
  const {
    field: { value: rangeValue, onChange },
  } = useController({ control, name });
  const range = rangeValue ?? EMPTY_SESSION_BROWSER_NUMERIC_RANGE;
  const [focusedBound, setFocusedBound] = useState<NumericRangeBound | null>(null);
  const [draftInput, setDraftInput] = useState('');
  const heading = unitSuffix === undefined ? label : `${label} (${unitSuffix})`;

  const updateRange = useCallback(
    (bound: NumericRangeBound, nextValue: number | null) => {
      const nextRange = compactNumericRange({
        min: bound === 'min' ? (nextValue ?? undefined) : range.min,
        max: bound === 'max' ? (nextValue ?? undefined) : range.max,
      });
      onChange(nextRange ?? EMPTY_SESSION_BROWSER_NUMERIC_RANGE);
    },
    [onChange, range],
  );

  const handleBoundFocus = useCallback(
    (bound: NumericRangeBound) => {
      setFocusedBound(bound);
      setDraftInput(toInputValue(range[bound]));
    },
    [range],
  );

  const handleBoundChange = useCallback(
    (bound: NumericRangeBound, event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      if (!DECIMAL_INPUT_PATTERN.test(inputValue)) {
        return;
      }
      setDraftInput(inputValue);
      updateRange(bound, parseInputValue(inputValue));
    },
    [updateRange],
  );

  const handleBlur = useCallback(() => {
    onChange(compactNumericRange(range) ?? EMPTY_SESSION_BROWSER_NUMERIC_RANGE);
    setFocusedBound(null);
  }, [onChange, range]);

  const renderBoundInput = (bound: NumericRangeBound, placeholder: string) => (
    <TextInput
      size='Small'
      inputMode='decimal'
      placeholder={placeholder}
      aria-label={`${label} ${placeholder}`}
      value={focusedBound === bound ? draftInput : toInputValue(range[bound])}
      onFocus={() => {
        handleBoundFocus(bound);
      }}
      onChange={(event) => {
        handleBoundChange(bound, event);
      }}
      onBlur={handleBlur}
    />
  );

  return (
    <div className='flex flex-col gap-small width-full'>
      <span className='text-label-small content-emphasis'>{heading}</span>
      <div className='flex flex-row gap-small width-full'>
        {renderBoundInput('min', minPlaceholder)}
        {renderBoundInput('max', maxPlaceholder)}
      </div>
    </div>
  );
};

export default ClientSessionBrowserNumericRangeField;
