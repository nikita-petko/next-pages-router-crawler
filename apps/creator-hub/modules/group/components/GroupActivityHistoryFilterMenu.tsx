import type { FC, ReactNode } from 'react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Select,
  MenuItem,
  Radio,
  Tooltip,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  SearchIcon,
  TextField,
  Avatar,
} from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useFilterDrawerEventEmitterContext } from '@modules/charts-generic/context/FilterDrawerEventEmitterContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useGroupActivityHistoryControllerStyles, {
  filterMenuChoiceStyle,
  useFilterDrawerMenuPropsClasses,
} from './GroupActivityHistoryController.styles';

export type DialogEventEmitter = {
  registerOnReset: (fn: () => void) => void;
  registerOnClear: (fn: () => void) => void;
  registerOnApply: (fn: () => void) => void;
  unregisterOnReset: (fn: () => void) => void;
  unregisterOnApply: (fn: () => void) => void;
  unregisterOnClear: (fn: () => void) => void;
};

function isArraySetDifferent<T>(a: Array<T>, b: Array<T>): boolean {
  if (a.length !== b.length) {
    return true;
  }
  // we don't care about ordering so use Set to decide
  const aSet = new Set(a);
  for (let idx = 0; idx < b.length; idx += 1) {
    if (!aSet.has(b[idx])) {
      return true;
    }
  }
  return false;
}

export function usePendingDialogState<T>(
  initial: Array<T>,
  emitter?: DialogEventEmitter,
  onChangeSubmit?: (newValue: Array<T>) => void,
  /** when overrideSignal is provided, listen to its changes and update current */
  overrideSignal?: Array<T>,
): [Array<T>, (newValue: Array<T>) => void] {
  const [current, setCurrent] = useState<Array<T>>(initial);
  useEffect(() => {
    const onReset = () => setCurrent(initial);
    const onApply = () => {
      if (!onChangeSubmit || !isArraySetDifferent(initial, current)) {
        return;
      }
      onChangeSubmit(current);
    };
    const onClear = () => setCurrent([]);
    if (emitter) {
      emitter.registerOnReset(onReset);
      emitter.registerOnApply(onApply);
      emitter.registerOnClear(onClear);
    }
    return () => {
      if (emitter) {
        emitter.unregisterOnReset(onReset);
        emitter.unregisterOnApply(onApply);
        emitter.unregisterOnClear(onClear);
      }
    };
  }, [current, initial, onChangeSubmit, setCurrent, emitter]);

  useEffect(() => {
    if (overrideSignal) {
      setCurrent(overrideSignal);
    }
  }, [overrideSignal]);

  // Wrap the setter in case there is no shared drawer emitter
  const setCurrentWrapper = useCallback(
    (newValue: Array<T>) => {
      setCurrent(newValue);
      if (!emitter && onChangeSubmit) {
        onChangeSubmit(newValue);
      }
    },
    [emitter, onChangeSubmit],
  );
  return [current, setCurrentWrapper];
}

const FilterChoiceWrapper: FC<
  React.PropsWithChildren<{
    name: FormattedText;
    isLoading?: boolean;
    showNoData?: boolean;
  }>
> = ({ children, name, isLoading, showNoData }) => {
  const {
    classes: { choiceHeader, choiceContainer, choiceLoadingCircularSpinner },
  } = useGroupActivityHistoryControllerStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const wrapped = (body: ReactNode, headingName: ReactNode, headingIcon: ReactNode) => {
    if (headingName === '') {
      return (
        <Grid container direction='column' className={choiceContainer}>
          {body}
        </Grid>
      );
    }
    return (
      <Grid container direction='column' className={choiceContainer}>
        <Grid item container direction='row' alignItems='center'>
          <Typography variant='smallLabel2' className={choiceHeader}>
            {headingName}
          </Typography>
          {headingIcon}
        </Grid>
        {body}
      </Grid>
    );
  };

  if (isLoading) {
    return wrapped(
      null,
      name,
      <CircularProgress size={14} color='secondary' className={choiceLoadingCircularSpinner} />,
    );
  }

  if (showNoData) {
    return wrapped(
      <Select
        disabled
        size='small'
        helperText={translate(
          translationKey('Label.NoValuesAvailable', TranslationNamespace.Organization),
        )}
      />,
      name,
      null,
    );
  }

  return wrapped(children, name, null);
};

// Implementations don't keep track of initial, they just represent and modify current state
type EnumImplProps<T extends string> = {
  options: Array<T>;
  current: T[];
  name: FormattedText;
  formatOption: (option: T) => FormattedText;
  onChange: (newValue: T[]) => void;
  multiple?: boolean;
  isLoading?: boolean;
};

const EnumDropdownImpl = function FilterDrawerEnumDropdownOption<T extends string>({
  options,
  current,
  name,
  onChange,
  formatOption,
  multiple,
  isLoading,
}: EnumImplProps<T>): React.JSX.Element {
  const {
    classes: { dropdown, dropdownOptions, dropdownAvatar, dropdownWrap },
  } = useGroupActivityHistoryControllerStyles();
  const menuPropsClasses = useFilterDrawerMenuPropsClasses();

  const { translate } = useTranslation();

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
      isLoading={isLoading}
      showNoData={isLoading === false && options.length === 0}>
      {multiple ? (
        <Autocomplete
          className={dropdown}
          getOptionLabel={(option) => option}
          multiple={multiple}
          value={current}
          options={options}
          renderInput={(params) => (
            <TextField
              {...params}
              variant='outlined'
              id='values'
              label={translate('Label.SearchCreator')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment variant='standard' position='start'>
                    <SearchIcon />
                    {params.InputProps.startAdornment}
                  </InputAdornment>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} className={dropdownOptions}>
              <Grid container alignItems='center' className={dropdownWrap}>
                <Grid item>
                  <Avatar className={dropdownAvatar} alt='avatar' variant='rounded' />
                </Grid>
                <Grid item>@{option}</Grid>
              </Grid>
            </li>
          )}
          onChange={(_, newValue) => onChange(newValue)}
          disablePortal
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
  } = useGroupActivityHistoryControllerStyles();
  const text = useMemo(() => formatOption(option), [formatOption, option]);

  const textRef = useRef<HTMLDivElement>(null);
  const [tooltipLabel, setTooltipLabel] = useState('');

  useLayoutEffect(() => {
    if (textRef.current?.clientWidth === filterMenuChoiceStyle.choiceMaxWidth) {
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
  onChange,
  formatOption,
  multiple,
  isLoading,
}: EnumImplProps<T>): React.JSX.Element {
  const {
    classes: { drawerFiltersColumn },
  } = useGroupActivityHistoryControllerStyles();

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
        isLoading={isLoading}
        showNoData={isLoading === false && options.length === 0}>
        {optionEls}
      </FilterChoiceWrapper>
    );
  }

  const half = Math.ceil(options.length / 2);
  return (
    <FilterChoiceWrapper name={name} isLoading={isLoading}>
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

export type GroupActivityHistoryFilterMenuProps<T extends string> = {
  type: 'Dropdown' | 'Column';
  name: FormattedText;
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

const GroupActivityHistoryFilterMenu = function GroupActivityHistoryFilterMenu<T extends string>({
  type,
  enumOptions,
  hiddenOptions = [],
  optionOrder = [],
  initial,
  formatOption: formatOptionGiven,
  name,
  onChangeSubmit,
  multiple,
  overrideSignal,
  blankOption,
  isLoading,
}: GroupActivityHistoryFilterMenuProps<T>): React.JSX.Element {
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

  if (type === 'Dropdown') {
    return (
      <EnumDropdownImpl
        {...{
          onChange: setCurrent,
          options,
          current: selectedOptions,
          name,
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
        formatOption,
        multiple,
        isLoading,
      }}
    />
  );
};

export default GroupActivityHistoryFilterMenu;
