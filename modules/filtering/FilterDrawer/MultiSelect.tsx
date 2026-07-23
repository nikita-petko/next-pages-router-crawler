// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/MultiSelect.tsx

import { Checkbox, MenuItem, Select, TSelectProps } from '@rbx/ui';
import { ComponentProps, ReactNode, useCallback, useMemo } from 'react';

interface MultiSelectProps<TOption> {
  blankValue?: string;
  disabled?: boolean;
  formatOption?: (option: TOption) => string;
  helperText?: ReactNode;
  label?: string;
  onChange: (given: TOption[]) => void;
  options: TOption[];
  rootClassName?: string;
  selectedOptions: TOption[];
  SelectProps?: Partial<ComponentProps<typeof Select>['SelectProps']>;
  size?: TSelectProps['size'];
}

function MultiSelect<TOption extends string>({
  blankValue,
  disabled,
  formatOption = (option) => option,
  helperText,
  label,
  onChange,
  options,
  rootClassName,
  selectedOptions,
  SelectProps,
  size,
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
      <MenuItem disableRipple key={option} value={option}>
        <Checkbox checked={selectedOptions.includes(option)} disableRipple size='small' />
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
      classes={
        rootClassName
          ? {
              root: rootClassName,
            }
          : undefined
      }
      data-testid='multi-select'
      disabled={disabled}
      helperText={helperText}
      label={label}
      onChange={onSelectionChange}
      SelectProps={{
        ...SelectProps,
        multiple: true,
        renderValue,
      }}
      size={size}
      value={selectedOptions}>
      {items}
    </Select>
  );
}

export default MultiSelect;
