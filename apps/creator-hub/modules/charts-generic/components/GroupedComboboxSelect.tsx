import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Divider, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import type { TTextInputSize } from '@rbx/foundation-ui';
import ComboboxTypeahead, { ComboboxTypeaheadOption } from './ComboboxTypeahead';

export type GroupedComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Disabled reason. Shown on hover and exposed to assistive tech on the option. */
  tooltip?: string;
};

export type GroupedComboboxGroup = {
  /** Stable key for the group (used for React keys and header dedupe). */
  id: string;
  /** Already-translated section header. */
  label: string;
  options: GroupedComboboxOption[];
};

export type GroupedComboboxSelectProps = {
  groups: readonly GroupedComboboxGroup[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
  isRequired?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
  size?: TTextInputSize;
  /** Show the section header above each group. Defaults to true. */
  showGroupLabels?: boolean;
  renderListboxInPortal?: boolean;
};

const filterGroups = (
  groups: readonly GroupedComboboxGroup[],
  query: string,
): GroupedComboboxGroup[] => {
  if (!query) {
    return [...groups];
  }
  const lowerQuery = query.toLowerCase();
  return groups
    .map((group) => {
      const groupMatches = group.label.toLowerCase().includes(lowerQuery);
      return {
        ...group,
        options: groupMatches
          ? group.options
          : group.options.filter((option) => option.label.toLowerCase().includes(lowerQuery)),
      };
    })
    .filter((group) => group.options.length > 0);
};

/**
 * A searchable single-select combobox whose options are rendered in labeled
 * sections, matching the explore-mode metric dropdown: a sticky caption header
 * per group and a divider between groups. Built on {@link ComboboxTypeahead}.
 *
 * Callers pass already-translated group headers and option labels.
 */
const GroupedComboboxSelect: FC<GroupedComboboxSelectProps> = ({
  groups,
  value,
  onChange,
  placeholder,
  label,
  className,
  isRequired,
  disabled,
  hasError,
  error,
  size = 'Large',
  showGroupLabels = true,
  renderListboxInPortal = true,
}) => {
  const selectedLabel = useMemo(() => {
    if (value === null) {
      return '';
    }
    for (const group of groups) {
      const match = group.options.find((option) => option.value === value);
      if (match) {
        return match.label;
      }
    }
    return '';
  }, [groups, value]);

  const handleSelect = useCallback(
    (optionValue: string, close: () => void) => {
      onChange(optionValue);
      close();
    },
    [onChange],
  );

  const hasOptions = groups.some((group) => group.options.length > 0);

  return (
    <ComboboxTypeahead
      className={className}
      label={label}
      placeholder={placeholder}
      selectedLabel={selectedLabel}
      hasResults={hasOptions}
      isRequired={isRequired}
      disabled={disabled}
      hasError={hasError}
      error={error}
      size={size}
      renderListboxInPortal={renderListboxInPortal}>
      {({ searchText, close }) => {
        const filtered = filterGroups(groups, searchText);
        return filtered.map((group, idx) => (
          <React.Fragment key={group.id}>
            {showGroupLabels && idx > 0 && <Divider variant='Standard' />}
            <div className='padding-y-small'>
              {showGroupLabels && (
                <div
                  role='none'
                  className='padding-x-medium padding-y-small text-caption-medium content-default bg-surface-100 sticky top-[0px] [z-index:1]'>
                  {group.label}
                </div>
              )}
              {group.options.map((option) => {
                const optionNode = (
                  <ComboboxTypeaheadOption
                    label={option.label}
                    isSelected={value === option.value}
                    disabled={option.disabled}
                    description={option.disabled ? option.tooltip : undefined}
                    onClick={() => handleSelect(option.value, close)}
                  />
                );
                if (!option.disabled || !option.tooltip) {
                  return <React.Fragment key={option.value}>{optionNode}</React.Fragment>;
                }
                return (
                  <Tooltip key={option.value} title={option.tooltip} position='top-start'>
                    <TooltipTrigger asChild>
                      <span className='block'>{optionNode}</span>
                    </TooltipTrigger>
                  </Tooltip>
                );
              })}
            </div>
          </React.Fragment>
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default GroupedComboboxSelect;
