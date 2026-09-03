import { useCallback, useMemo } from 'react';
import { Checkbox, Radio, RadioGroup } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import FilterStringChoice from './FilterStringChoice';
import type { BlankHandlingConfig } from './FilterStringChoice';

export const CONTROLLED_FILTER_ENUM_MAX_INLINE_OPTIONS = 6;
const CONTROLLED_FILTER_ENUM_SINGLE_COLUMN_MAX_OPTIONS = 3;

const ROOT_CLASS_NAME = 'flex flex-col gap-small width-full';
const SINGLE_COLUMN_CLASS_NAME = 'flex flex-col gap-small';
const TWO_COLUMN_CLASS_NAME = 'grid gap-small [grid-template-columns:repeat(2,minmax(0,1fr))]';

export type ControlledFilterEnumChoiceProps<T extends string> = {
  readonly label: FormattedText;
  readonly options: readonly T[];
  readonly selectedOptions: readonly T[];
  readonly formatOption: (option: T) => FormattedText;
  readonly onChange: (newValue: T[]) => void;
  readonly multiple?: boolean;
  readonly blankHandling?: BlankHandlingConfig<T>;
  readonly isLoading?: boolean;
  readonly className?: string;
};

const ControlledFilterEnumChoice = <T extends string>({
  label,
  options,
  selectedOptions,
  formatOption,
  onChange,
  multiple,
  blankHandling,
  isLoading,
  className,
}: ControlledFilterEnumChoiceProps<T>) => {
  const displayOptions = useMemo<T[]>(() => {
    if (isLoading) {
      return [...selectedOptions];
    }
    return [...options, ...selectedOptions.filter((option) => !options.includes(option))];
  }, [isLoading, options, selectedOptions]);

  const handleCheckedChange = useCallback(
    (option: T, isChecked: boolean) => {
      onChange(
        isChecked
          ? [...selectedOptions, option]
          : selectedOptions.filter((selected) => selected !== option),
      );
    },
    [onChange, selectedOptions],
  );

  const handleRadioChange = useCallback(
    (option: string) => {
      const selectedOption = displayOptions.find((candidate) => candidate === option);
      onChange(selectedOption === undefined ? [] : [selectedOption]);
    },
    [displayOptions, onChange],
  );

  if (displayOptions.length > CONTROLLED_FILTER_ENUM_MAX_INLINE_OPTIONS) {
    return (
      <FilterStringChoice
        size='small'
        label={label}
        multiple={multiple}
        selectedOptions={[...selectedOptions]}
        options={[...options]}
        formatOption={formatOption}
        blankHandling={blankHandling}
        isLoading={isLoading}
        className={className}
        onChange={onChange}
      />
    );
  }

  const optionLayoutClassName =
    displayOptions.length <= CONTROLLED_FILTER_ENUM_SINGLE_COLUMN_MAX_OPTIONS
      ? SINGLE_COLUMN_CLASS_NAME
      : TWO_COLUMN_CLASS_NAME;

  return (
    <div className={className === undefined ? ROOT_CLASS_NAME : `${ROOT_CLASS_NAME} ${className}`}>
      <span className='text-label-small content-emphasis'>{label}</span>
      {multiple ? (
        <div className={optionLayoutClassName}>
          {displayOptions.map((option) => (
            <Checkbox
              key={option}
              size='Small'
              placement='Start'
              label={formatOption(option)}
              isChecked={selectedOptions.includes(option)}
              isDisabled={isLoading}
              onCheckedChange={(isChecked) => {
                if (isChecked !== 'indeterminate') {
                  handleCheckedChange(option, isChecked);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <RadioGroup
          aria-label={label}
          size='Small'
          placement='Start'
          value={selectedOptions[0]}
          isDisabled={isLoading}
          className={optionLayoutClassName}
          onValueChange={handleRadioChange}>
          {displayOptions.map((option) => (
            <Radio key={option} value={option} label={formatOption(option)} />
          ))}
        </RadioGroup>
      )}
    </div>
  );
};

export default ControlledFilterEnumChoice;
