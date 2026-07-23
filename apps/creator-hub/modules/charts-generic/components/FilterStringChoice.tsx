import React, { useCallback, useMemo } from 'react';
import { CircularProgress, MenuItem, Select, Tooltip, TSelectProps } from '@rbx/ui';
import { FormattedText } from '@modules/analytics-translations';
import MultiSelect from './MultiSelect';
import useFilterDrawerStyles, {
  useFilterDrawerMenuPropsClasses,
} from './FilterDrawer/FilterDrawer.styles';

export enum BlankHandlingType {
  Value,
  Option,
}

export type BlankHandlingConfig<T> =
  // Renders value when blank. Value can be different from the options provided.
  | {
      type: BlankHandlingType.Value;
      value: FormattedText;
    }
  // Renders option as the selected value when there is no selection
  | {
      type: BlankHandlingType.Option;
      option: T;
    };

export type FilterStringChoiceProps<T> = {
  label?: FormattedText;
  isLoading?: boolean;
  multiple?: boolean;
  selectedOptions: T[];
  formatOption: 'literal' | ((option: T) => FormattedText);
  options: T[];
  onChange: (newValue: T[]) => void;
  blankHandling?: BlankHandlingConfig<T>;
  helperText?: React.ReactNode;
  size?: TSelectProps['size'];
  tooltipOnDisabled?: React.ReactNode;
};

const blankToken = '_$_EMPTY_$_';

function FilterStringChoice<T extends string>({
  label,
  multiple,
  selectedOptions,
  isLoading,
  options: optionsGiven,
  formatOption: formatOptionGiven,
  onChange: onChangeGiven,
  blankHandling,
  helperText,
  size,
  tooltipOnDisabled,
}: FilterStringChoiceProps<T>) {
  const {
    classes: { dropdownLoadingCircular },
  } = useFilterDrawerStyles();
  const menuPropsClasses = useFilterDrawerMenuPropsClasses();

  const formatOption = useCallback(
    (option: T) => {
      if (formatOptionGiven === 'literal') {
        return option as string as FormattedText;
      }
      return formatOptionGiven(option);
    },
    [formatOptionGiven],
  );

  const menuItemsForSingleSelect = useMemo(() => {
    if (isLoading) {
      return selectedOptions.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {formatOption(opt)}
        </MenuItem>
      ));
    }

    const mainOptions = optionsGiven.map((option) => {
      return (
        <MenuItem key={option} value={option}>
          {formatOption(option)}
        </MenuItem>
      );
    });
    const unknownOptions = selectedOptions
      .filter((opt) => !optionsGiven.includes(opt))
      .map((option) => (
        <MenuItem key={option} value={option}>
          {formatOption(option)}
        </MenuItem>
      ));

    if (!blankHandling || blankHandling.type === BlankHandlingType.Option) return mainOptions;
    return [
      <MenuItem key={blankToken} value={blankToken}>
        {blankHandling.value}
      </MenuItem>,
      ...mainOptions,
      ...unknownOptions,
    ];
  }, [blankHandling, formatOption, isLoading, optionsGiven, selectedOptions]);

  const blankValue = useMemo(() => {
    if (!blankHandling) return undefined;
    const option = blankHandling?.type;
    switch (option) {
      case BlankHandlingType.Value:
        return blankHandling.value;
      case BlankHandlingType.Option:
        return formatOption(blankHandling.option);
      default: {
        const exhaustiveCheck: never = blankHandling;
        throw new Error(`Unhandled blankHandling type ${exhaustiveCheck}`);
      }
    }
  }, [blankHandling, formatOption]);

  const selectProps: React.ComponentProps<typeof Select>['SelectProps'] = useMemo(() => {
    const singleSelectRenderValue = (value: unknown) => {
      // This is only used in a single selector, it's overridden in MultiSelect.tsx
      if (!selectedOptions.length || value === blankToken) {
        return blankValue ?? '';
      }
      return formatOption(value as T);
    };

    return {
      MenuProps: {
        classes: menuPropsClasses,
      },
      endAdornment: isLoading ? (
        <CircularProgress size={14} color='secondary' className={dropdownLoadingCircular} />
      ) : undefined,
      renderValue: multiple ? undefined : singleSelectRenderValue,
      size,
    };
  }, [
    blankValue,
    dropdownLoadingCircular,
    formatOption,
    isLoading,
    menuPropsClasses,
    multiple,
    selectedOptions.length,
    size,
  ]);

  const onChangeSingle = useCallback<NonNullable<React.ComponentProps<typeof Select>['onChange']>>(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value as unknown as T;
      if (newValue === blankToken) {
        onChangeGiven([]);
      } else {
        onChangeGiven([newValue]);
      }
    },
    [onChangeGiven],
  );

  const options: T[] = useMemo(() => {
    if (isLoading) {
      return selectedOptions;
    }
    return [...optionsGiven, ...selectedOptions.filter((opt) => !optionsGiven.includes(opt))];
  }, [isLoading, optionsGiven, selectedOptions]);

  const disabled = isLoading || !options.length;

  const singleSelectedOption = useMemo(() => {
    if (selectedOptions.length) {
      return selectedOptions[0];
    }
    if (blankHandling?.type === BlankHandlingType.Option) {
      return blankHandling.option;
    }
    return blankToken;
  }, [blankHandling, selectedOptions]);

  return (
    <Tooltip title={disabled ? tooltipOnDisabled : undefined} placement='top' arrow>
      <span>
        {multiple ? (
          <MultiSelect
            data-testid='filter-string-multi-dropdown'
            onChange={onChangeGiven}
            selectedOptions={selectedOptions}
            options={options}
            SelectProps={selectProps}
            disabled={disabled}
            blankValue={blankValue}
            formatOption={formatOption}
            label={label}
            helperText={helperText}
          />
        ) : (
          <Select
            data-testid='filter-string-single-dropdown'
            value={singleSelectedOption}
            SelectProps={selectProps}
            onChange={onChangeSingle}
            disabled={disabled}
            label={label}
            fullWidth
            helperText={helperText}>
            {menuItemsForSingleSelect}
          </Select>
        )}
      </span>
    </Tooltip>
  );
}

export default FilterStringChoice;
