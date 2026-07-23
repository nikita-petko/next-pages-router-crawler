import React, { useCallback, useMemo } from 'react';
import { Checkbox, MenuItem, Select, TSelectProps } from '@rbx/ui';
import { FormattedText } from '@modules/analytics-translations';

export interface MultiSelectProps<TOption> {
  SelectProps?: Partial<React.ComponentProps<typeof Select>['SelectProps']>;
  label?: string;
  onChange: (given: TOption[]) => void;
  selectedOptions: TOption[];
  options: TOption[];
  formatOption?: (option: TOption) => string;
  rootClassName?: string;
  size?: TSelectProps['size'];
  disabled?: boolean;
  helperText?: React.ReactNode;
  blankValue?: FormattedText;
}

function MultiSelect<TOption extends string>({
  selectedOptions,
  onChange,
  options,
  SelectProps,
  label,
  rootClassName,
  formatOption = (option) => option,
  size,
  disabled,
  helperText,
  blankValue,
}: MultiSelectProps<TOption>) {
  const onSelectionChange = useCallback(
    (e: React.ChangeEvent<{ value: unknown }>) => {
      const { value } = e.target;
      if (!Array.isArray(value)) {
        throw new Error('Select with multiple items should have array values');
      }
      onChange(value as TOption[]);
    },
    [onChange],
  );

  const sortedOptions = useMemo(() => {
    // If an option is in `current`, bring it to the front, otherwise retain existing sort order
    return [...options].sort((a, b) => {
      const aIsSelected = selectedOptions.includes(a);
      const bIsSelected = selectedOptions.includes(b);
      if (aIsSelected && !bIsSelected) {
        return -1;
      }
      if (!aIsSelected && bIsSelected) {
        return 1;
      }
      return 0;
    });
  }, [options, selectedOptions]);

  const items = useMemo(() => {
    return sortedOptions.map((option) => (
      <MenuItem key={option} value={option} disableRipple>
        <Checkbox checked={selectedOptions.includes(option)} size='small' disableRipple />
        {formatOption(option)}
      </MenuItem>
    ));
  }, [formatOption, sortedOptions, selectedOptions]);

  const renderValue = useCallback(
    (value: unknown) => {
      if (blankValue && !(value as TOption[]).length) {
        return blankValue;
      }
      return selectedOptions.map((option) => formatOption(option)).join(', ');
    },
    [blankValue, formatOption, selectedOptions],
  );

  return (
    <Select
      label={label}
      classes={
        rootClassName
          ? {
              root: rootClassName,
            }
          : undefined
      }
      data-testid='multi-select'
      size={size}
      value={selectedOptions}
      SelectProps={{
        ...SelectProps,
        multiple: true,
        renderValue,
      }}
      onChange={onSelectionChange}
      disabled={disabled}
      helperText={helperText}>
      {items}
    </Select>
  );
}

export default MultiSelect;
