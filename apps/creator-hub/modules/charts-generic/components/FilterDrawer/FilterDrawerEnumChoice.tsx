import {
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Select,
  MenuItem,
  Radio,
  Tooltip,
} from '@rbx/ui';
import React, { ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import { usePendingDialogState } from './DialogEventEmitter';
import FilterChoiceWrapper from './FilterChoiceWrapper';
import useFilterDrawerStyles, {
  filterDrawerEnumChoiceStyle,
  useFilterDrawerMenuPropsClasses,
} from './FilterDrawer.styles';
import MultiSelect from '../MultiSelect';
import { useFilterDrawerEventEmitterContext } from '../../context/FilterDrawerEventEmitterContext';

// If we wanted to allow for non-string enums (e.g. objects/symbols),
//  we would need another prop to convert them to unique values for the UI options selectors.
export type FilterDrawerEnumChoiceProps<T extends string> = {
  name: FormattedText;
  description?: ReactNode;
  enumOptions: T[];
  initial: T[];
  formatOption: 'literal' | ((option: T) => FormattedText);
  onChangeSubmit?: (newValue: T[]) => void;
  multiple?: boolean;
  overrideSignal?: T[];

  // hiddenOptions will take precedence over optionOrder, but not over initial
  hiddenOptions?: Array<T>;
  optionOrder?: Array<T>;

  blankOption?: T;

  isLoading?: boolean;
};

// Implementations don't keep track of initial, they just represent and modify current state
type EnumImplProps<T extends string> = {
  options: Array<T>;
  current: T[];
  name: FormattedText;
  description?: ReactNode;
  formatOption: (option: T) => FormattedText;
  onChange: (newValue: T[]) => void;
  multiple?: boolean;
  isLoading?: boolean;
};

const EnumDropdownImpl = function FilterDrawerEnumDropdownOption<T extends string>({
  options,
  current,
  name,
  description,
  onChange,
  formatOption,
  multiple,
  isLoading,
}: EnumImplProps<T>): React.JSX.Element {
  const menuPropsClasses = useFilterDrawerMenuPropsClasses();

  const singleSelectMenuItems = useMemo(() => {
    return options.map((option) => {
      return (
        <MenuItem key={option} value={option}>
          {formatOption(option)}
        </MenuItem>
      );
    });
  }, [formatOption, options]);

  const selectProps = useMemo(
    () => ({ MenuProps: { classes: menuPropsClasses } }),
    [menuPropsClasses],
  );

  return (
    <FilterChoiceWrapper
      name={name}
      description={description}
      isLoading={isLoading}
      showNoData={isLoading === false && options.length === 0}>
      {multiple ? (
        <MultiSelect
          onChange={onChange}
          selectedOptions={current}
          options={options}
          SelectProps={selectProps}
          formatOption={formatOption}
        />
      ) : (
        <Select
          data-testid='filter-drawer-enum-single-select'
          value={current}
          size='small'
          SelectProps={selectProps}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value as unknown as T;
            onChange([newValue]);
          }}>
          {singleSelectMenuItems}
        </Select>
      )}
    </FilterChoiceWrapper>
  );
};

type EnumValueImplProps<T extends string> = {
  option: T;
  current: T[];
  onChange: (newValue: T[]) => void;
  formatOption: (option: T) => FormattedText;
  multiple?: boolean;
};

const EnumValueImpl = function FilterDrawerEnumValueImpl<T extends string>({
  option,
  current,
  onChange,
  formatOption,
  multiple,
}: EnumValueImplProps<T>) {
  const {
    classes: { choiceOptionLabel, choiceOptionControl, choiceOptionLabelTypography, tooltip },
  } = useFilterDrawerStyles();
  const text = formatOption(option);

  const textRef = useRef<HTMLDivElement>(null);
  const [tooltipLabel, setTooltipLabel] = useState('');

  useLayoutEffect(() => {
    if (textRef.current?.clientWidth === filterDrawerEnumChoiceStyle.choiceMaxWidth) {
      setTooltipLabel(text);
    }
  }, [text]);

  const Control = multiple ? Checkbox : Radio;
  const controlTestId = multiple ? 'filter-drawer-enum-checkbox' : 'filter-drawer-enum-radio';
  return (
    <Grid item>
      <FormControlLabel
        classes={{ label: choiceOptionLabel }}
        key={option}
        control={
          <Control
            data-testid={controlTestId}
            color='secondary'
            checked={current.includes(option)}
            onChange={(event) => {
              if (event.target.checked) {
                onChange(multiple ? [...current, option] : [option]);
              } else {
                onChange(current.filter((c) => c !== option));
              }
            }}
            aria-label={text}
            classes={{ root: choiceOptionControl }}
            disableRipple
          />
        }
        label={
          <Tooltip
            title={tooltipLabel}
            classes={{ tooltip }}
            arrow
            data-testid='filter-chip-tooltip'>
            <Typography
              noWrap
              className={choiceOptionLabelTypography}
              variant='body2'
              display='block'
              ref={textRef}>
              {text}
            </Typography>
          </Tooltip>
        }
      />
    </Grid>
  );
};

const numOptionsPerColumn = 3;
const EnumColumnsImpl = function FilterDrawerEnumColumnsOption<T extends string>({
  options,
  current,
  name,
  description,
  onChange,
  formatOption,
  multiple,
  isLoading,
}: EnumImplProps<T>): React.JSX.Element {
  const {
    classes: { drawerFiltersColumn },
  } = useFilterDrawerStyles();

  const optionEls = useMemo(() => {
    return options.map((option) => {
      return (
        <EnumValueImpl
          key={option}
          {...{
            option,
            current,
            onChange,
            formatOption,
            multiple,
          }}
        />
      );
    });
  }, [options, current, onChange, formatOption, multiple]);

  // split into two columns with the left and right columns having half the options each
  // if there are 3 or fewer options, put them all in a single column (avoid truncating)
  if (options.length <= numOptionsPerColumn) {
    return (
      <FilterChoiceWrapper
        name={name}
        description={description}
        isLoading={isLoading}
        showNoData={isLoading === false && options.length === 0}>
        {optionEls}
      </FilterChoiceWrapper>
    );
  }

  const half = Math.ceil(options.length / 2);
  return (
    <FilterChoiceWrapper name={name} description={description} isLoading={isLoading}>
      <Grid container direction='row'>
        <Grid item classes={{ root: drawerFiltersColumn }}>
          <Grid container direction='column' data-testid='filter-drawer-enum-column'>
            {optionEls.slice(0, half)}
          </Grid>
        </Grid>
        <Grid item classes={{ root: drawerFiltersColumn }}>
          <Grid container direction='column' data-testid='filter-drawer-enum-column'>
            {optionEls.slice(half)}
          </Grid>
        </Grid>
      </Grid>
    </FilterChoiceWrapper>
  );
};

const FilterDrawerEnumChoice = function FilterDrawerEnumChoice<T extends string>({
  enumOptions,
  hiddenOptions = [],
  optionOrder = [],
  initial = [],
  formatOption: formatOptionGiven,
  name,
  description,
  onChangeSubmit,
  multiple,
  overrideSignal,
  blankOption,
  isLoading,
}: FilterDrawerEnumChoiceProps<T>): React.JSX.Element {
  const emitter = useFilterDrawerEventEmitterContext();
  const [current, setCurrent] = usePendingDialogState(
    initial,
    emitter,
    onChangeSubmit,
    overrideSignal,
  );

  const selectedOptions = useMemo(() => {
    // TODO(DSA-2203): handle blank entry better when it's multi select
    if (!multiple && blankOption && !current.length) {
      return [blankOption];
    }

    return current;
  }, [blankOption, current, multiple]);

  // TODO(gperkins@20240525): Somehow combine with useRAQIV2DimensionChoiceRenderBundle?
  const options = useMemo(() => {
    const shouldShow = (option: T) => initial.includes(option) || !hiddenOptions.includes(option);
    const ordered = optionOrder.filter(shouldShow);
    const unordered = enumOptions.filter(
      (option) => !ordered.includes(option) && shouldShow(option),
    );
    return [...ordered, ...unordered];
  }, [initial, hiddenOptions, enumOptions, optionOrder]);

  const formatOption: (opt: T) => FormattedText = useMemo(() => {
    // We provide the 'literal' option for convenience
    // in case callers want to be less rigorous about translations
    return formatOptionGiven === 'literal'
      ? (opt: T) => opt as string as FormattedText
      : formatOptionGiven;
  }, [formatOptionGiven]);

  if (options.length > 2 * numOptionsPerColumn) {
    return (
      <EnumDropdownImpl
        {...{
          onChange: setCurrent,
          options,
          current: selectedOptions,
          name,
          description,
          formatOption,
          multiple,
          isLoading,
        }}
      />
    );
  }
  return (
    <EnumColumnsImpl
      {...{
        onChange: setCurrent,
        options,
        current: selectedOptions,
        name,
        description,
        formatOption,
        multiple,
        isLoading,
      }}
    />
  );
};

export default FilterDrawerEnumChoice;
