import React, { useCallback, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Autocomplete, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import useAutocompleteChoiceControlStyles from './AutocompleteChoiceControl.styles';
import OptionsPopperComponent from './OptionsPopperComponent';

const none = '$__NONE__$'; // This should never be a RAQIV2 metric name
type TNoneOption = typeof none;

type AutocompleteChoiceControlProps<TOption> = {
  options: TOption[];
  value: TOption | null;
  setValue: (value: TOption | null) => void;
  getOptionFormattedLabel: (option: TOption) => FormattedText;
  selectorLabel: FormattedText;
  groupBy?: (option: TOption) => string;
};

const AutocompleteChoiceControl = <TOption extends string>({
  options,
  value: currentMetric,
  setValue,
  getOptionFormattedLabel,
  selectorLabel,
  groupBy,
}: AutocompleteChoiceControlProps<TOption>) => {
  const {
    classes: { root, popper, listbox },
  } = useAutocompleteChoiceControlStyles();
  const onValueChange = useCallback(
    (event: React.SyntheticEvent, value: TOption | TNoneOption) => {
      if (value === none) {
        setValue(null);
      } else {
        setValue(value);
      }
    },
    [setValue],
  );

  const { translate } = useTranslationWrapper(useTranslation());
  const getOptionLabel = useCallback(
    (option: TOption | TNoneOption) => {
      if (option === none) {
        return translate(translationKey('Label.None', TranslationNamespace.Analytics));
      }
      return getOptionFormattedLabel(option);
    },
    [getOptionFormattedLabel, translate],
  );

  const renderInput = useCallback<
    NonNullable<React.ComponentProps<typeof Autocomplete>['renderInput']>
  >((params) => <TextField {...params} id='values' label={selectorLabel} />, [selectorLabel]);

  const groupByWithNone = useMemo(() => {
    if (!groupBy) {
      return undefined;
    }
    return (option: TOption | TNoneOption) => (option === none ? '' : groupBy(option));
  }, [groupBy]);

  return (
    <Autocomplete
      value={currentMetric === null ? none : currentMetric}
      disableClearable
      onChange={onValueChange}
      options={options}
      classes={{
        root,
        popper,
        listbox,
      }}
      renderInput={renderInput}
      getOptionLabel={getOptionLabel}
      groupBy={groupByWithNone}
      PopperComponent={OptionsPopperComponent}
      data-testid='autocomplete-choice-control'
    />
  );
};

export default AutocompleteChoiceControl;
