import type {
  ChangeEvent,
  FunctionComponent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { useCallback, useId, useState } from 'react';
import { clsx, IconButton, SearchInput } from '@rbx/foundation-ui';

export type DevelopmentItemsSearchScope = {
  label: string;
  value: string;
};

export type DevelopmentItemsScopedSearchProps = {
  ariaLabel: string;
  clearLabel: string;
  getSuggestionLabel: (query: string, scope: DevelopmentItemsSearchScope) => string;
  onChange: (value: string) => void;
  onClear: () => void;
  onCommit: (value: string) => void;
  onDismiss: () => void;
  onSelectScope: (scope: DevelopmentItemsSearchScope, query: string) => void;
  placeholder: string;
  scopes: readonly DevelopmentItemsSearchScope[];
  suggestionsLabel: string;
  value: string;
};

const preventMouseDownDefault = (event: ReactMouseEvent<HTMLButtonElement>) =>
  event.preventDefault();

type DevelopmentItemsScopeSuggestionProps = {
  id: string;
  isSelected: boolean;
  label: string;
  onSelect: (scope: DevelopmentItemsSearchScope) => void;
  scope: DevelopmentItemsSearchScope;
};

const DevelopmentItemsScopeSuggestion: FunctionComponent<DevelopmentItemsScopeSuggestionProps> = ({
  id,
  isSelected,
  label,
  onSelect,
  scope,
}) => {
  const scopeLabelStart = label.lastIndexOf(scope.label);
  const labelPrefix = scopeLabelStart < 0 ? label : label.slice(0, scopeLabelStart);
  const handleClick = useCallback(() => {
    onSelect(scope);
  }, [onSelect, scope]);

  return (
    <button
      aria-label={label}
      aria-selected={isSelected}
      className={clsx(
        'flex items-center gap-medium width-full padding-x-medium padding-y-small stroke-none cursor-pointer text-align-x-left focus-visible:outline-focus',
        isSelected ? 'bg-shift-200' : 'bg-none hover:bg-shift-100',
      )}
      id={id}
      onClick={handleClick}
      onMouseDown={preventMouseDownDefault}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich suggestions use the WAI-ARIA listbox option pattern and cannot use native <option>.
      role='option'
      type='button'>
      <span className='text-no-wrap text-truncate-split'>
        <span className='text-body-medium content-default'>{labelPrefix}</span>
        {scopeLabelStart >= 0 && (
          <span className='text-label-medium content-emphasis'>{scope.label}</span>
        )}
      </span>
    </button>
  );
};

const DevelopmentItemsScopedSearch: FunctionComponent<DevelopmentItemsScopedSearchProps> = ({
  ariaLabel,
  clearLabel,
  getSuggestionLabel,
  onChange,
  onClear,
  onCommit,
  onDismiss,
  onSelectScope,
  placeholder,
  scopes,
  suggestionsLabel,
  value,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsId = useId();
  const trimmedValue = value.trim();
  const showSuggestions = isFocused && trimmedValue.length > 0 && scopes.length > 0;
  const activeSuggestionIndex = Math.min(selectedIndex, scopes.length - 1);
  const activeSuggestionId = `${suggestionsId}-${activeSuggestionIndex}`;
  const handleDismiss = useCallback(() => {
    setIsFocused(false);
    onDismiss();
  }, [onDismiss]);
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setSelectedIndex(0);
      onChange(event.currentTarget.value);
    },
    [onChange],
  );
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setSelectedIndex(0);
  }, []);
  const handleSelectSuggestion = useCallback(
    (scope: DevelopmentItemsSearchScope) => {
      onSelectScope(scope, trimmedValue);
      setIsFocused(false);
    },
    [onSelectScope, trimmedValue],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) {
        if (event.key === 'Enter') {
          onCommit(event.currentTarget.value);
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((currentIndex) => Math.min(currentIndex + 1, scopes.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedScope = scopes[activeSuggestionIndex];
        if (selectedScope != null) {
          handleSelectSuggestion(selectedScope);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDismiss();
      }
    },
    [
      activeSuggestionIndex,
      handleDismiss,
      handleSelectSuggestion,
      onCommit,
      scopes,
      showSuggestions,
    ],
  );

  return (
    <div className='relative width-full'>
      <SearchInput
        aria-activedescendant={showSuggestions ? activeSuggestionId : undefined}
        aria-autocomplete='list'
        aria-controls={showSuggestions ? suggestionsId : undefined}
        aria-expanded={showSuggestions}
        aria-haspopup='listbox'
        aria-label={ariaLabel}
        leadingIconName='icon-regular-magnifying-glass'
        onBlur={handleDismiss}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- SearchInput renders a native <input>; the role establishes the WAI-ARIA combobox pattern.
        role='combobox'
        size='Medium'
        tabIndex={0}
        trailingIconNode={
          value.length > 0 ? (
            <IconButton
              ariaLabel={clearLabel}
              as='button'
              icon='icon-regular-x'
              isCircular
              onClick={onClear}
              onMouseDown={preventMouseDownDefault}
              size='Small'
              variant='Utility'
            />
          ) : undefined
        }
        value={value}
      />
      {showSuggestions && (
        <div
          aria-label={suggestionsLabel}
          className='absolute left-[0] right-[0] [top:calc(100%+4px)] [z-index:10] flex flex-col padding-y-small bg-surface-100 stroke-standard stroke-default radius-medium'
          id={suggestionsId}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich suggestion content requires the WAI-ARIA listbox pattern and cannot use native <select>.
          role='listbox'>
          <span className='text-label-small content-muted padding-x-medium padding-y-small'>
            {suggestionsLabel}
          </span>
          {scopes.map((scope, index) => {
            const label = getSuggestionLabel(trimmedValue, scope);
            return (
              <DevelopmentItemsScopeSuggestion
                id={`${suggestionsId}-${index}`}
                isSelected={activeSuggestionIndex === index}
                key={scope.value}
                label={label}
                onSelect={handleSelectSuggestion}
                scope={scope}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DevelopmentItemsScopedSearch;
