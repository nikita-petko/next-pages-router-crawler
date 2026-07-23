import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { TextField, TTextFieldProps } from '@rbx/ui';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { usePrevious } from '@rbx/react-utilities';
import { Key } from '@rbx/core';

type DebouncedTextFieldProps = TTextFieldProps & {
  onDebouncedChange: (input: string) => void;
  debounceTime?: number;
};

const DebouncedTextField: React.ForwardRefRenderFunction<
  HTMLDivElement,
  DebouncedTextFieldProps
> = ({ onDebouncedChange, debounceTime = 300, value, ...props }, ref) => {
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(event.target.value, false);
    },
    [handleChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === Key.Enter) {
        handleChange((event.target as HTMLInputElement).value, true);
      }
    },
    [handleChange],
  );

  const handleOnBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      handleChange((event.target as HTMLInputElement).value, true);
    },
    [handleChange],
  );

  return (
    <TextField
      ref={ref}
      {...props}
      value={innerValue || value}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
    />
  );
};

export default forwardRef(DebouncedTextField);
