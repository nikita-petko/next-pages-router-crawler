import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import type { TSelectProps } from '@rbx/ui';
import { Tooltip } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { FoundationLikeMultiSelect } from './FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu,
  MenuItem,
  MenuSection,
} from './FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import type { TDropdownSize } from './FoundationLikeMultiSelect/FoundationLikeShared';

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
  helperText?: ReactNode;
  size?: TSelectProps['size'];
  tooltipOnDisabled?: ReactNode;
  className?: string;
  maxSelectedOptions?: number;
  pinnedOptions?: readonly T[];
  truncateValue?: boolean;
  /**
   * When an option's formatted label ends with ` (<optionValue>)` (e.g. a Place
   * rendered as `My Game (1234567890)`), render the trailing id on a muted
   * second line in the menu and keep only the name as the row title. This keeps
   * the disambiguating id fully visible instead of truncating it to fit the
   * fixed-width dropdown. No-op for options whose label doesn't carry the id.
   */
  showOptionIdAsDescription?: boolean;
};

// Sentinel value for the "clear selection" menu row in single-select mode with
// a `BlankHandlingType.Value` blank handler. It must not collide with a real
// option, hence the unusual token.
const blankToken = '_$_EMPTY_$_';
const noPinnedOptions = [] as const;

const toFoundationSize = (size?: TSelectProps['size']): TDropdownSize =>
  size === 'small' ? 'Small' : 'Medium';

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
  className,
  maxSelectedOptions,
  pinnedOptions: pinnedOptionsGiven,
  truncateValue,
  showOptionIdAsDescription,
}: FilterStringChoiceProps<T>) {
  const pinnedOptions = pinnedOptionsGiven ?? noPinnedOptions;
  const formatOption = useCallback(
    (option: T): string => {
      if (formatOptionGiven === 'literal') {
        return option;
      }
      return formatOptionGiven(option);
    },
    [formatOptionGiven],
  );

  // While loading we can only surface what's already selected; once options
  // arrive we merge in any selected values that aren't part of the fetched set
  // (e.g. stale persisted selections) so they remain visible/selectable.
  const displayOptions = useMemo<T[]>(() => {
    if (isLoading) {
      return selectedOptions;
    }
    return [...optionsGiven, ...selectedOptions.filter((opt) => !optionsGiven.includes(opt))];
  }, [isLoading, optionsGiven, selectedOptions]);

  const disabled = Boolean(isLoading) || displayOptions.length === 0;

  const blankValueText = useMemo<string | undefined>(() => {
    if (!blankHandling) {
      return undefined;
    }
    switch (blankHandling.type) {
      case BlankHandlingType.Value:
        return blankHandling.value;
      case BlankHandlingType.Option:
        return formatOption(blankHandling.option);
      default: {
        const exhaustiveCheck: never = blankHandling;
        throw new Error(`Unhandled blankHandling type ${String(exhaustiveCheck)}`);
      }
    }
  }, [blankHandling, formatOption]);

  // The array handed to the underlying multiselect. In single-select mode we
  // keep it to a single entry (or the blank sentinel) so the check mark and
  // trigger label line up with the legacy `Select` behaviour.
  const value = useMemo<string[]>(() => {
    if (multiple) {
      return selectedOptions;
    }
    if (selectedOptions.length) {
      return [selectedOptions[0]];
    }
    if (blankHandling?.type === BlankHandlingType.Option) {
      return [blankHandling.option];
    }
    if (blankHandling?.type === BlankHandlingType.Value) {
      return [blankToken];
    }
    return [];
  }, [blankHandling, multiple, selectedOptions]);

  const menuItems = useMemo(() => {
    const hasReachedMaxSelectedOptions =
      multiple === true &&
      maxSelectedOptions !== undefined &&
      selectedOptions.length >= maxSelectedOptions;
    const items = displayOptions.map((option) => {
      const fullLabel = formatOption(option);
      let title = fullLabel;
      let description: string | undefined;
      if (showOptionIdAsDescription) {
        const idSuffix = ` (${option})`;
        if (fullLabel.length > idSuffix.length && fullLabel.endsWith(idSuffix)) {
          title = fullLabel.slice(0, -idSuffix.length);
          description = option;
        }
      }
      const isDisabledByMaxSelectedOptions =
        hasReachedMaxSelectedOptions && !selectedOptions.includes(option);
      const isPinned = pinnedOptions.includes(option);
      return (
        <MenuItem
          key={option}
          value={option}
          title={title}
          description={description}
          disabled={isDisabledByMaxSelectedOptions || isPinned}
        />
      );
    });
    if (!multiple && blankHandling?.type === BlankHandlingType.Value) {
      return [
        <MenuItem key={blankToken} value={blankToken} title={blankHandling.value} />,
        ...items,
      ];
    }
    return items;
  }, [
    blankHandling,
    displayOptions,
    formatOption,
    maxSelectedOptions,
    multiple,
    pinnedOptions,
    selectedOptions,
    showOptionIdAsDescription,
  ]);

  const formatValue = useCallback(
    (selected: string[]): string => {
      if (multiple) {
        if (!selectedOptions.length) {
          return blankValueText ?? '';
        }
        return selectedOptions.map((option) => formatOption(option)).join(', ');
      }
      const [first] = selected;
      if (!selectedOptions.length || first === blankToken) {
        return blankValueText ?? '';
      }
      // `selected` only ever holds option values we rendered, which are `T`.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- value originates from our own `T` option set
      return formatOption(first as T);
    },
    [blankValueText, formatOption, multiple, selectedOptions],
  );

  const onValueChange = useCallback(
    (next: string[]) => {
      if (multiple) {
        const nextWithPinnedOptions = [
          ...next,
          ...pinnedOptions.filter((option) => !next.includes(option)),
        ];
        if (maxSelectedOptions !== undefined && nextWithPinnedOptions.length > maxSelectedOptions) {
          return;
        }
        // The multiselect only emits values from the `T` options we rendered.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- values originate from our own `T` option set
        onChangeGiven(nextWithPinnedOptions as T[]);
        return;
      }
      // Single-select: the multiselect reports a toggled set, so derive the
      // newly added entry. Selecting the already-active row is a no-op.
      const added = next.find((v) => !value.includes(v));
      if (added === undefined) {
        return;
      }
      if (added === blankToken) {
        onChangeGiven([]);
        return;
      }
      // `added` is a freshly selected option value, which is always a `T`.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- value originates from our own `T` option set
      onChangeGiven([added as T]);
    },
    [maxSelectedOptions, multiple, onChangeGiven, pinnedOptions, value],
  );

  const hasValue = multiple ? Boolean(blankValueText) || selectedOptions.length > 0 : undefined;

  const control = (
    <FoundationLikeMultiSelect
      className={className}
      label={label}
      ariaLabel={label ? undefined : 'filter'}
      size={toFoundationSize(size)}
      placeholder={label ?? ''}
      value={value}
      onValueChange={onValueChange}
      formatValue={formatValue}
      truncateValue={truncateValue}
      hasValue={hasValue}
      hint={typeof helperText === 'string' ? helperText : undefined}
      isDisabled={disabled}>
      <Menu>
        <MenuSection>{menuItems}</MenuSection>
      </Menu>
    </FoundationLikeMultiSelect>
  );

  if (disabled && tooltipOnDisabled) {
    return (
      <Tooltip title={tooltipOnDisabled} placement='top' arrow>
        <div className='width-full'>{control}</div>
      </Tooltip>
    );
  }

  return control;
}

export default FilterStringChoice;
