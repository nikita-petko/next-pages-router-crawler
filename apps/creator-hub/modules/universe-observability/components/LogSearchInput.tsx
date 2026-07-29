import type { ChangeEvent, FC, FocusEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SearchInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { usePrevious } from '@rbx/react-utilities';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const LOG_SEARCH_DEBOUNCE_TIME_MS = 500;

export type LogSearchInputProps = {
  readonly value: string;
  readonly onDebouncedChange: (value: string) => void;
  readonly debounceTime?: number;
  readonly isDisabled?: boolean;
};

const LogSearchInput: FC<LogSearchInputProps> = ({
  value,
  onDebouncedChange,
  debounceTime = LOG_SEARCH_DEBOUNCE_TIME_MS,
  isDisabled = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [inputValue, setInputValue] = useState<string | null>(null);
  const previousValue = usePrevious(value);
  const [debounceOnChange, clearDebounceTimeout, debounceTimeoutRef] = useDebouncedFunction(
    onDebouncedChange,
    debounceTime,
  );

  useEffect(() => clearDebounceTimeout, [clearDebounceTimeout]);

  useEffect(() => {
    if (previousValue !== value && value !== inputValue && debounceTimeoutRef.current === null) {
      setInputValue(null);
    }
  }, [debounceTimeoutRef, inputValue, previousValue, value]);

  const handleValueChange = useCallback(
    (nextValue: string, flushImmediately: boolean) => {
      setInputValue(nextValue);
      if (flushImmediately || nextValue.length === 0) {
        clearDebounceTimeout();
        onDebouncedChange(nextValue);
        return;
      }

      debounceOnChange(nextValue);
    },
    [clearDebounceTimeout, debounceOnChange, onDebouncedChange],
  );
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleValueChange(event.target.value, false);
    },
    [handleValueChange],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleValueChange(event.currentTarget.value, true);
      }
    },
    [handleValueChange],
  );
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      handleValueChange(event.currentTarget.value, true);
    },
    [handleValueChange],
  );
  const searchLabel = tPendingTranslation(
    'Search logs',
    'Accessible label and placeholder for searching log messages.',
    translationKey('ServerDetailsPage.Logs.SearchLabel', TranslationNamespace.ServerManagement),
  );

  return (
    <div className='self-end width-full large:margin-left-auto large:width-[280px]'>
      <SearchInput
        aria-label={searchLabel}
        isDisabled={isDisabled}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={searchLabel}
        size='Medium'
        value={inputValue ?? value}
      />
    </div>
  );
};

export default withNamespaceSwitchedTranslation(LogSearchInput, [
  TranslationNamespace.ServerManagement,
]);
