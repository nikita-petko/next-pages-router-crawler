import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TextInput } from '@rbx/foundation-ui';
import type { TTextInputSize } from '@rbx/foundation-ui';
import { usePrevious } from '@rbx/react-utilities';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';

export type FoundationDebouncedTextInputProps = {
  value: string;
  onDebouncedChange: (input: string) => void;
  debounceTime?: number;
  label?: string;
  placeholder?: string;
  size?: TTextInputSize;
  id?: string;
  isDisabled?: boolean;
  className?: string;
  'data-testid'?: string;
};

/**
 * Foundation (`@rbx/foundation-ui`) counterpart of the legacy
 * `DebouncedTextField`. Debounces keystrokes before notifying the consumer and
 * flushes immediately on blur, Enter, or when the field is cleared so filter
 * state never lags behind the user's last meaningful action.
 */
const FoundationDebouncedTextInput: FC<FoundationDebouncedTextInputProps> = ({
  value,
  onDebouncedChange,
  debounceTime = 300,
  label,
  placeholder,
  size = 'Medium',
  id,
  isDisabled,
  className,
  'data-testid': dataTestId,
}) => {
  const [innerValue, setInnerValue] = useState<string | null>(null);
  const [debounceOnInputChange, clearDebounceTimeout, debounceTimeoutRef] = useDebouncedFunction(
    onDebouncedChange,
    debounceTime,
  );

  // Allow the consumer to push a new value without unmounting, but don't
  // clobber what the user is actively typing (a debounce is still pending).
  const prevValue = usePrevious(value);
  useEffect(() => {
    if (prevValue !== value && value !== innerValue && !debounceTimeoutRef.current) {
      setInnerValue(null);
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

  const input = (
    <TextInput
      id={id}
      data-testid={dataTestId}
      label={label}
      placeholder={placeholder}
      size={size}
      isDisabled={isDisabled}
      value={innerValue ?? value}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        handleChange(event.target.value, false)
      }
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handleChange(event.currentTarget.value, true);
        }
      }}
      onBlur={(event: React.FocusEvent<HTMLInputElement>) =>
        handleChange(event.currentTarget.value, true)
      }
    />
  );

  // `TextInput`'s root is `width-full`, so a width passed via `className` fights
  // that built-in class. Wrap it instead and let the input fill a sized box —
  // mirroring how the Foundation multiselect's `width-full` trigger fills its
  // fixed-width root, so the keyword field lines up with the other controls.
  return className ? <div className={className}>{input}</div> : input;
};

export default FoundationDebouncedTextInput;
