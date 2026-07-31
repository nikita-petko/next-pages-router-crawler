import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Autocomplete, Grid, TextField } from '@rbx/ui';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AnnouncementOptionRaw } from './useAnnouncementCompareData';

type AnnouncementSelectorProps = {
  label: string;
  options: AnnouncementOptionRaw[];
  selectedOptions: AnnouncementOptionRaw[];
  value: AnnouncementOptionRaw | undefined;
  onChange: (option: AnnouncementOptionRaw | undefined) => void;
  allowEmpty?: boolean;
  getOptionLabel: (opt: AnnouncementOptionRaw) => string;
};

const AnnouncementSelector: FC<AnnouncementSelectorProps> = ({
  label,
  options,
  selectedOptions,
  value,
  onChange,
  allowEmpty,
  getOptionLabel,
}) => {
  const isOptionEqualToValue = useCallback(
    (opt1: AnnouncementOptionRaw | undefined, opt2: AnnouncementOptionRaw | undefined) =>
      opt1?.id === opt2?.id,
    [],
  );

  const isOptionAlreadySelected = useCallback(
    (option: AnnouncementOptionRaw) =>
      selectedOptions.some((s) => s.id === option.id && s.id !== value?.id),
    [selectedOptions, value?.id],
  );

  return (
    <Autocomplete
      disableClearable={!allowEmpty}
      value={value ?? null}
      style={{ width: 350 }}
      onChange={(_, newValue) => {
        if (!allowEmpty && !newValue) {
          return;
        }
        onChange(newValue ?? undefined);
      }}
      size='small'
      options={options}
      getOptionLabel={getOptionLabel}
      getOptionDisabled={isOptionAlreadySelected}
      renderInput={(params) => <TextField {...params} label={label} />}
      isOptionEqualToValue={isOptionEqualToValue}
    />
  );
};

type LabeledAnnouncementSelectorsContainerProps = {
  translate: TranslationKeyToFormattedText;
  options: AnnouncementOptionRaw[];
  selectedOptions: AnnouncementOptionRaw[];
  maximumSelections?: number;
  onChange: (selected: Array<AnnouncementOptionRaw | undefined>) => void;
  getOptionLabel: (opt: AnnouncementOptionRaw) => string;
};

const LabeledAnnouncementSelectorsContainer: FC<LabeledAnnouncementSelectorsContainerProps> = ({
  translate,
  options,
  selectedOptions,
  maximumSelections = 3,
  onChange,
  getOptionLabel,
}) => {
  const handleChange = useCallback(
    (index: number, newValue: AnnouncementOptionRaw | undefined) => {
      if (newValue) {
        const newSelected = selectedOptions.toSpliced(index, 1, newValue);
        onChange(newSelected);
      } else {
        const newSelected = selectedOptions.toSpliced(index, 1);
        onChange(newSelected);
      }
    },
    [onChange, selectedOptions],
  );

  const selectors = useMemo(() => {
    const result = selectedOptions.map((opt, index) => (
      <AnnouncementSelector
        // oxlint-disable-next-line react/no-array-index-key -- The slot position is the identity. An id-based key makes React reuse the trailing empty selector as the next slot, which carries over its input text and its focus.
        key={index}
        label={translate(translationKey('Label.DateRangeNumber', TranslationNamespace.Analytics), {
          number: (index + 1).toString(),
        })}
        options={options}
        selectedOptions={selectedOptions}
        value={opt}
        onChange={(val) => handleChange(index, val)}
        allowEmpty={index !== 0}
        getOptionLabel={getOptionLabel}
      />
    ));

    if (result.length < maximumSelections) {
      const emptyIndex = result.length;
      result.push(
        <AnnouncementSelector
          key={emptyIndex}
          label={translate(
            translationKey('Label.DateRangeNumber', TranslationNamespace.Analytics),
            { number: (emptyIndex + 1).toString() },
          )}
          options={options}
          selectedOptions={selectedOptions}
          value={undefined}
          onChange={(val) => handleChange(emptyIndex, val)}
          allowEmpty
          getOptionLabel={getOptionLabel}
        />,
      );
    }

    return result;
  }, [handleChange, maximumSelections, options, selectedOptions, translate, getOptionLabel]);

  return (
    <Grid container style={{ padding: '24px 0px 16px 0px', gap: 16 }}>
      {selectors}
    </Grid>
  );
};

export default LabeledAnnouncementSelectorsContainer;
