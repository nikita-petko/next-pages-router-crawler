import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { TextInput, Icon } from '@rbx/foundation-ui';

const VIEWPORT_BOTTOM_PADDING = 16;

const dropdownPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
  border: '1px solid var(--color-stroke-default)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  marginTop: '4px',
  backgroundColor: 'var(--color-surface-100)',
};

type ComboboxTypeaheadRenderProps = {
  searchText: string;
  close: () => void;
};

export type ComboboxTypeaheadProps = {
  label: string;
  placeholder: string;
  selectedLabel: string;
  hasResults: boolean;
  hasError?: boolean;
  error?: string;
  disabled?: boolean;
  onBlur?: () => void;
  children: (props: ComboboxTypeaheadRenderProps) => React.ReactNode;
};

const getOptions = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));

const ACTIVE_OPTION_CLASS = 'bg-shift-200';

const ComboboxTypeahead: FC<ComboboxTypeaheadProps> = ({
  label,
  placeholder,
  selectedLabel,
  hasResults,
  hasError,
  error,
  disabled,
  onBlur,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText('');
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMaxHeight(window.innerHeight - rect.bottom - VIEWPORT_BOTTOM_PADDING);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchText]);

  useEffect(() => {
    if (!listboxRef.current) return;
    const options = getOptions(listboxRef.current);
    options.forEach((el, i) => {
      el.classList.toggle(ACTIVE_OPTION_CLASS, i === activeIndex);
    });
    if (activeIndex >= 0 && options[activeIndex]) {
      options[activeIndex].scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, hasResults, searchText]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchText('');
    setActiveIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const renderedOptions = children({ searchText, close });
  const hasVisibleOptions = React.Children.count(renderedOptions) > 0;

  useEffect(() => {
    if (hasVisibleOptions) return;
    setActiveIndex(-1);
  }, [hasVisibleOptions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        close();
        (e.target as HTMLInputElement).blur();
        return;
      }

      if (!listboxRef.current) return;
      const count = getOptions(listboxRef.current).length;
      if (count === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const options = getOptions(listboxRef.current);
        options[activeIndex]?.click();
      }
    },
    [close, activeIndex],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !containerRef.current) return;
        if (listboxRef.current?.contains(e.target as Node)) return;

        const comboboxInput =
          containerRef.current.querySelector<HTMLInputElement>('input[role="combobox"]');
        if (!comboboxInput || e.target === comboboxInput) return;

        e.preventDefault();
        if (isOpen) {
          close();
          comboboxInput.blur();
          return;
        }

        setIsOpen(true);
        setSearchText('');
        setActiveIndex(-1);
        comboboxInput.focus();
      }}>
      <TextInput
        label={label}
        size='Medium'
        placeholder={placeholder}
        value={isOpen ? searchText : selectedLabel}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchText(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          if (disabled) return;
          setIsOpen(true);
          setSearchText('');
        }}
        onKeyDown={handleKeyDown}
        trailingIconName='icon-regular-chevron-large-down'
        role='combobox'
        aria-expanded={isOpen && hasResults && hasVisibleOptions}
        autoComplete='off'
        hasError={hasError}
        error={error}
        isDisabled={disabled}
      />
      {isOpen && hasResults && hasVisibleOptions && (
        <div
          ref={listboxRef}
          role='listbox'
          className='radius-medium'
          style={{ ...dropdownPanelStyle, maxHeight }}>
          {renderedOptions}
        </div>
      )}
    </div>
  );
};

export default ComboboxTypeahead;

const OPTION_CLASS_NAME =
  'flex items-center justify-between padding-x-medium height-1000 cursor-pointer text-body-medium content-default radius-small hover:bg-shift-200 transition-colors';

export type ComboboxTypeaheadOptionProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

export const ComboboxTypeaheadOption: FC<ComboboxTypeaheadOptionProps> = ({
  label: optionLabel,
  isSelected,
  onClick,
}) => (
  <div
    role='option'
    aria-selected={isSelected}
    tabIndex={0}
    className={OPTION_CLASS_NAME}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}>
    <span className='text-truncate-split'>{optionLabel}</span>
    {isSelected && <Icon name='icon-filled-check' size='Medium' />}
  </div>
);
