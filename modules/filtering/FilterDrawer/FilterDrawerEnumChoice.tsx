// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawerEnumChoice.tsx

import {
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  Select,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { ChangeEvent, ReactElement, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { usePendingDialogState } from './DialogEventEmitter';
import FilterChoiceWrapper from './FilterChoiceWrapper';
import useFilterDrawerStyles, {
  filterDrawerEnumChoiceStyle,
  useFilterDrawerMenuPropsClasses,
} from './FilterDrawer.styles';
import MultiSelect from './MultiSelect';
import { useFilterDrawerEventEmitterContext } from '../FilterDrawerEventEmitterContext';

// If we wanted to allow for non-string enums (e.g. objects/symbols),
//  we would need another prop to convert them to unique values for the UI options selectors.
type FilterDrawerEnumChoiceProps<T extends string> = {
  blankOption?: T;
  enumOptions: T[];
  formatOption: 'literal' | ((option: T) => string);
  // hiddenOptions will take precedence over optionOrder, but not over initial
  hiddenOptions?: Array<T>;
  initial: T[];
  isLoading?: boolean;
  multiple?: boolean;

  name: string;
  onChangeSubmit?: (newValue: T[]) => void;

  optionOrder?: Array<T>;

  overrideSignal?: T[];
};

// Implementations don't keep track of initial, they just represent and modify current state
type EnumImplProps<T extends string> = {
  current: T[];
  formatOption: (option: T) => string;
  isLoading?: boolean;
  multiple?: boolean;
  name: string;
  onChange: (newValue: T[]) => void;
  options: Array<T>;
};

const EnumDropdownImpl = function FilterDrawerEnumDropdownOption<T extends string>({
  current,
  formatOption,
  isLoading,
  multiple,
  name,
  onChange,
  options,
}: EnumImplProps<T>): ReactElement<any> {
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
      isLoading={isLoading}
      name={name}
      showNoData={isLoading === false && options.length === 0}>
      {multiple ? (
        <MultiSelect
          formatOption={formatOption}
          onChange={onChange}
          options={options}
          selectedOptions={current}
          SelectProps={selectProps}
        />
      ) : (
        <Select
          data-testid='filter-drawer-enum-single-select'
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value as unknown as T;
            onChange([newValue]);
          }}
          SelectProps={selectProps}
          size='small'
          value={current}>
          {singleSelectMenuItems}
        </Select>
      )}
    </FilterChoiceWrapper>
  );
};

type EnumValueImplProps<T extends string> = {
  current: T[];
  formatOption: (option: T) => string;
  multiple?: boolean;
  onChange: (newValue: T[]) => void;
  option: T;
};

const EnumValueImpl = function FilterDrawerEnumValueImpl<T extends string>({
  current,
  formatOption,
  multiple,
  onChange,
  option,
}: EnumValueImplProps<T>) {
  const {
    classes: { choiceOptionControl, choiceOptionLabel, choiceOptionLabelTypography, tooltip },
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
        control={
          <Control
            aria-label={text}
            checked={current.includes(option)}
            classes={{ root: choiceOptionControl }}
            color='secondary'
            data-testid={controlTestId}
            disableRipple
            onChange={(event) => {
              if (event.target.checked) {
                onChange(multiple ? [...current, option] : [option]);
              } else {
                onChange(current.filter((c) => c !== option));
              }
            }}
          />
        }
        key={option}
        label={
          <Tooltip
            arrow
            classes={{ tooltip }}
            data-testid='filter-chip-tooltip'
            title={tooltipLabel}>
            <Typography
              className={choiceOptionLabelTypography}
              display='block'
              noWrap
              ref={textRef}
              variant='body2'>
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
  current,
  formatOption,
  isLoading,
  multiple,
  name,
  onChange,
  options,
}: EnumImplProps<T>): ReactElement<any> {
  const {
    classes: { drawerFiltersColumn },
  } = useFilterDrawerStyles();

  const optionEls = useMemo(() => {
    return options.map((option) => {
      return (
        <EnumValueImpl
          key={option}
          {...{
            current,
            formatOption,
            multiple,
            onChange,
            option,
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
        isLoading={isLoading}
        name={name}
        showNoData={isLoading === false && options.length === 0}>
        {optionEls}
      </FilterChoiceWrapper>
    );
  }

  const half = Math.ceil(options.length / 2);
  return (
    <FilterChoiceWrapper isLoading={isLoading} name={name}>
      <Grid container direction='row'>
        <Grid classes={{ root: drawerFiltersColumn }} item>
          <Grid container data-testid='filter-drawer-enum-column' direction='column'>
            {optionEls.slice(0, half)}
          </Grid>
        </Grid>
        <Grid classes={{ root: drawerFiltersColumn }} item>
          <Grid container data-testid='filter-drawer-enum-column' direction='column'>
            {optionEls.slice(half)}
          </Grid>
        </Grid>
      </Grid>
    </FilterChoiceWrapper>
  );
};

const FilterDrawerEnumChoice = function FilterDrawerEnumChoice<T extends string>({
  blankOption,
  enumOptions,
  formatOption: formatOptionGiven,
  hiddenOptions = [],
  initial = [],
  isLoading,
  multiple,
  name,
  onChangeSubmit,
  optionOrder = [],
  overrideSignal,
}: FilterDrawerEnumChoiceProps<T>): ReactElement<any> {
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

  const formatOption: (opt: T) => string = useMemo(() => {
    // We provide the 'literal' option for convenience
    // in case callers want to be less rigorous about translations
    return formatOptionGiven === 'literal'
      ? (opt: T) => opt as string as string
      : formatOptionGiven;
  }, [formatOptionGiven]);

  if (options.length > 2 * numOptionsPerColumn) {
    return (
      <EnumDropdownImpl
        {...{
          current: selectedOptions,
          formatOption,
          isLoading,
          multiple,
          name,
          onChange: setCurrent,
          options,
        }}
      />
    );
  }
  return (
    <EnumColumnsImpl
      {...{
        current: selectedOptions,
        formatOption,
        isLoading,
        multiple,
        name,
        onChange: setCurrent,
        options,
      }}
    />
  );
};

export default FilterDrawerEnumChoice;
