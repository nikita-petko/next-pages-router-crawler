import { useState, useCallback, useEffect } from 'react';
import { TextInput, type TTextInputProps } from '@rbx/foundation-ui';
import { Key } from '@rbx/core';
import { usePrevious } from '@rbx/react-utilities';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';

/** Ref: https://www.algolia.com/doc/ui-libraries/autocomplete/guides/debouncing-sources#select-a-debounce-delay */
const DEFAULT_DEBOUNCE_TIME = 200;

type DebouncedTextInputProps = TTextInputProps & {
  /** The callback to call when the input value changes. Prefer this over `onChange`. */
  onDebouncedChange: (input: string) => void;
  /** The time to debounce the input value changes. */
  debounceTime?: number;
  /** Ref to the underlying TextInput wrapper (see Foundation TextInput). */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * A debounced foundation-ui TextInput. Handles the following:
 * - Debouncing the input value changes while typing.
 * - No debounce on input value changes when confirm / blur.
 */
export default function DebouncedTextInput({
  ref,
  onDebouncedChange,
  debounceTime = DEFAULT_DEBOUNCE_TIME,
  value,
  onChange,
  onKeyDown,
  onBlur,
  ...props
}: DebouncedTextInputProps) {
  const [innerValue, setInnerValue] = useState<string | null>(null);
  const [debounceOnInputChange, clearDebounceTimeout, debounceTimeoutRef] = useDebouncedFunction(
    onDebouncedChange,
    debounceTime,
  );

  // Allow new values without clobbering
  const prevValue = usePrevious(value);
  useEffect(() => {
    if (prevValue !== value && value !== innerValue) {
      if (!debounceTimeoutRef.current) {
        setInnerValue(null);
      }
    }
  }, [value, prevValue, innerValue, debounceTimeoutRef]);

  /** Update the inner value and debounce if necessary. */
  const updateValue = useCallback(
    (input: string, shouldOverrideDebounce: boolean = false) => {
      setInnerValue(input);
      if (shouldOverrideDebounce || input.length === 0) {
        clearDebounceTimeout();
        onDebouncedChange(input);
      } else {
        debounceOnInputChange(input);
      }
    },
    [clearDebounceTimeout, debounceOnInputChange, onDebouncedChange],
  );

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateValue(event.target.value);
      onChange?.(event);
    },
    [updateValue, onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === Key.Enter) {
        updateValue((event.target as HTMLInputElement).value, true);
      }
      onKeyDown?.(event);
    },
    [updateValue, onKeyDown],
  );

  const handleOnBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      updateValue((event.target as HTMLInputElement).value, true);
      onBlur?.(event);
    },
    [updateValue, onBlur],
  );

  return (
    <TextInput
      {...props}
      ref={ref}
      value={innerValue || value}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
    />
  );
}
