// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/charts/DebouncedTextField.tsx

import { Key } from '@rbx/core';
import { usePrevious } from '@rbx/react-utilities';
import { TextField, TTextFieldProps } from '@rbx/ui';
import { ChangeEvent, FocusEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react';

import useDebouncedFunction from '../hooks/useDebouncedFunction';

type DebouncedTextFieldProps = TTextFieldProps & {
  debounceTime?: number;
  onDebouncedChange: (input: string) => void;
};

const DebouncedTextField = ({
  debounceTime = 300,
  onDebouncedChange,
  value,
  ...props
}: DebouncedTextFieldProps) => {
  const [innerValue, setInnerValue] = useState<string | null>(null);
  const [debounceOnInputChange, clearDebounceTimeout, debounceTimeoutRef] = useDebouncedFunction(
    onDebouncedChange,
    debounceTime,
  );

  // INFO(cmccarty@20230628) Allow consumer to pass a new value without unmounting the component,
  // but don't clobber if the user is still actively typing
  const prevValue = usePrevious(value);
  useEffect(() => {
    if (prevValue !== value && value !== innerValue) {
      if (!debounceTimeoutRef.current) {
        setInnerValue(null);
      }
    }
  }, [value, prevValue, innerValue, debounceTimeoutRef]);

  const handleChange = useCallback(
    (input: string, overrideDebounce: boolean) => {
      setInnerValue(input);
      if (overrideDebounce || input.length === 0) {
        clearDebounceTimeout();
        onDebouncedChange(input);
      } else {
        debounceOnInputChange(input);
      }
    },
    [clearDebounceTimeout, debounceOnInputChange, onDebouncedChange],
  );

  const handleOnChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleChange(event.target.value, false);
    },
    [handleChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === Key.Enter) {
        handleChange((event.target as HTMLInputElement).value, true);
      }
    },
    [handleChange],
  );

  const handleOnBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      handleChange((event.target as HTMLInputElement).value, true);
    },
    [handleChange],
  );

  return (
    <TextField
      {...props}
      onBlur={handleOnBlur}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      value={innerValue || value || ''}
    />
  );
};

export default DebouncedTextField;
