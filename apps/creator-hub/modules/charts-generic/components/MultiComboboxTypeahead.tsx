import { useCallback, useMemo } from 'react';
import type { TTextInputSize } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import ComboboxTypeahead, { ComboboxTypeaheadOption } from './ComboboxTypeahead';

export type MultiComboboxTypeaheadProps<TOption extends string> = {
  options: TOption[];
  value: TOption[];
  setValue: (value: TOption[]) => void;
  getOptionLabel: (option: TOption) => FormattedText;
  label?: string;
  placeholder: string;
  isLoading?: boolean;
  size?: TTextInputSize;
  className?: string;
};

const MultiComboboxTypeahead = <TOption extends string>({
  options,
  value,
  setValue,
  getOptionLabel,
  label,
  placeholder,
  isLoading,
  size,
  className,
}: MultiComboboxTypeaheadProps<TOption>) => {
  const optionsWithLabels = useMemo(
    () => options.map((option) => ({ option, label: getOptionLabel(option) })),
    [options, getOptionLabel],
  );

  const selectedLabel = useMemo(() => {
    if (value.length === 0) {
      return '';
    }
    const selectedSet = new Set<TOption>(value);
    return optionsWithLabels
      .filter(({ option }) => selectedSet.has(option))
      .map(({ label: optionLabel }) => optionLabel)
      .join(', ');
  }, [value, optionsWithLabels]);

  const toggleOption = useCallback(
    (option: TOption) => {
      if (value.includes(option)) {
        setValue(value.filter((selected) => selected !== option));
        return;
      }
      setValue([...value, option]);
    },
    [value, setValue],
  );

  return (
    <ComboboxTypeahead
      label={label}
      placeholder={placeholder}
      selectedLabel={selectedLabel}
      hasResults={optionsWithLabels.length > 0}
      disabled={isLoading}
      size={size}
      className={className}>
      {({ searchText }) => {
        const query = searchText.trim().toLowerCase();
        const visible = query
          ? optionsWithLabels.filter((entry) => entry.label.toLowerCase().includes(query))
          : optionsWithLabels;
        return visible.map(({ option, label: optionLabel }) => (
          <ComboboxTypeaheadOption
            key={option}
            label={optionLabel}
            isSelected={value.includes(option)}
            onClick={() => toggleOption(option)}
          />
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default MultiComboboxTypeahead;
