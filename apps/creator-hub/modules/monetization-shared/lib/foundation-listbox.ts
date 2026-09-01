import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TListboxOption = {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
};

const TYPEAHEAD_TIMEOUT = 500;
const LETTER_REGEX = /^[a-z0-9]$/i;

/**
 * Walk options circularly so arrow navigation wraps and skips disabled rows.
 */
function findEnabledOption(
  options: TListboxOption[],
  start: number,
  step: number,
): TListboxOption | undefined {
  if (options.length === 0) {
    return undefined;
  }

  for (let i = 0; i < options.length; i += 1) {
    const nextIdx = (start + step * i + options.length) % options.length;
    const next = options[nextIdx];
    if (!next.disabled) {
      return next;
    }
  }
  return undefined;
}

/**
 * Shared active-option controller for listbox popups that cannot use Radix Select directly.
 */
export function useListboxController() {
  const [options, setOptions] = useState<TListboxOption[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const searchRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Options register from menu rows so navigation does not depend on DOM focus or querySelector.
  const registerOption = useCallback((option: TListboxOption) => {
    setOptions((current) => {
      const existingIndex = current.findIndex((item) => item.id === option.id);
      if (existingIndex === -1) {
        return [...current, option];
      }
      const next = [...current];
      next[existingIndex] = option;
      return next;
    });

    return () => {
      setOptions((current) => current.filter((item) => item.id !== option.id));
      setActiveId((current) => (current === option.id ? undefined : current));
    };
  }, []);

  const activeOption = useMemo(
    () => options.find((option) => option.id === activeId),
    [activeId, options],
  );

  const activateFirst = useCallback(() => {
    const next = findEnabledOption(options, 0, 1);
    setActiveId(next?.id);
    return next;
  }, [options]);

  const activateLast = useCallback(() => {
    const next = findEnabledOption(options, options.length - 1, -1);
    setActiveId(next?.id);
    return next;
  }, [options]);

  const activateNext = useCallback(() => {
    const currentIdx = options.findIndex((option) => option.id === activeId);
    const next = findEnabledOption(options, currentIdx + 1, 1);
    setActiveId(next?.id);
    return next;
  }, [activeId, options]);

  const activatePrevious = useCallback(() => {
    const currentIdx = options.findIndex((option) => option.id === activeId);
    const next = findEnabledOption(options, currentIdx - 1, -1);
    setActiveId(next?.id);
    return next;
  }, [activeId, options]);

  const resetTypeahead = useCallback(() => {
    clearTimeout(timerRef.current);
    searchRef.current = '';
  }, []);

  const isTypeaheadKey = useCallback((key: string) => LETTER_REGEX.test(key), []);

  const handleTypeahead = useCallback(
    (key: string) => {
      clearTimeout(timerRef.current);
      // Keep a short-lived search buffer, matching Dropdown-style incremental typeahead.
      const isStarting = searchRef.current.length === 0;
      searchRef.current += key.toLowerCase();
      timerRef.current = setTimeout(() => {
        searchRef.current = '';
      }, TYPEAHEAD_TIMEOUT);

      const search = searchRef.current;
      const currentIdx = options.findIndex((option) => option.id === activeId);
      const enabledMatches = options
        .map((option, i) => ({ option, i }))
        .filter(({ option }) => !option.disabled && option.label.toLowerCase().startsWith(search));

      if (enabledMatches.length === 0) {
        return undefined;
      }

      const next = isStarting
        ? (enabledMatches.find(({ i }) => i > currentIdx) ?? enabledMatches[0])
        : (enabledMatches.find(({ i }) => i >= currentIdx) ?? enabledMatches[0]);

      setActiveId(next.option.id);
      return next.option;
    },
    [activeId, options],
  );

  const clearActive = useCallback(() => setActiveId(undefined), []);

  useEffect(() => {
    // Clear active state if filtering/unmounting removes or disables the active row
    if (activeId && !options.some((option) => option.id === activeId && !option.disabled)) {
      setActiveId(undefined);
    }
  }, [activeId, options]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return {
    options,
    activeId,
    activeOption,
    registerOption,
    setActiveId,
    clearActive,
    activateFirst,
    activateLast,
    activateNext,
    activatePrevious,
    handleTypeahead,
    isTypeaheadKey,
    resetTypeahead,
  } as const;
}
