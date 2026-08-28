import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
  Button,
  InfoOutlinedIcon,
  Tooltip,
} from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import SharedSorterAndFilter from '../../translation/components/shared/SorterAndFilter';
import { sortingOptionsLabelMap } from '../constants';
import EntryFilterOptions from '../enums/EntryFilterOptions';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import MultiCheckbox from './MultiCheckbox';
import useSorterAndFilterStyles from './SorterAndFilter.styles';

export interface SorterAndFilterProps {
  sortingOption: EntrySortingOptions;
  setSortingOption: (newSortingOption: EntrySortingOptions) => void;
  filterOptions: EntryFilterOptions[];
  setFilterOptions: (filterOptions: EntryFilterOptions[]) => void;
  onMenuToggled: (isMenuOpen: boolean) => void;
}

const LegacySorterAndFilter: FunctionComponent<React.PropsWithChildren<SorterAndFilterProps>> = ({
  sortingOption,
  setSortingOption,
  filterOptions,
  setFilterOptions,
  onMenuToggled,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      spacing,
      header,
      container,
      radioButtons,
      radioGroup,
      buttonContainer,
      tooltip,
      tooltipContainer,
    },
  } = useSorterAndFilterStyles();
  const [selectedSortingOption, setSelectedSortingOption] =
    useState<EntrySortingOptions>(sortingOption);
  const [selectedFilterOptions, setSelectedFilterOptions] =
    useState<EntryFilterOptions[]>(filterOptions);

  const clearAllFilters = () => {
    setSelectedSortingOption(EntrySortingOptions.Default);
    setSelectedFilterOptions([]);
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sortOption = event.target.value;
    if (sortOption in EntrySortingOptions) {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      const key = sortOption as keyof typeof EntrySortingOptions;
      setSelectedSortingOption(EntrySortingOptions[key]);
    }
  };

  const handleApplyChangesClicked = () => {
    setSortingOption(selectedSortingOption);
    setFilterOptions(selectedFilterOptions);
    onMenuToggled(false);
  };

  const handleCancelClicked = () => {
    onMenuToggled(false);
  };

  const renderFilterCheckbox = (allowedValues: EntryFilterOptions[]) => (
    <MultiCheckbox
      checkedValues={selectedFilterOptions}
      allowedValues={allowedValues}
      setCheckedValues={setSelectedFilterOptions}
    />
  );

  return (
    <>
      {' '}
      <Grid className={container} container direction='column'>
        <Typography className={header} variant='overline'>
          {translate('Title.SortBy')}
        </Typography>
        <RadioGroup className={radioGroup} id='sortOptions' onChange={handleRadioChange}>
          {Object.values(EntrySortingOptions).map((sortOption) => {
            return (
              <FormControlLabel
                classes={{ labelPlacementStart: spacing }}
                key={sortOption}
                value={sortOption}
                labelPlacement='start'
                control={
                  <Radio
                    className={radioButtons}
                    size='small'
                    color='primary'
                    checked={selectedSortingOption === sortOption}
                    aria-label={translate(sortingOptionsLabelMap[sortOption])}
                  />
                }
                label={
                  <Typography variant='captionBody'>
                    {translate(sortingOptionsLabelMap[sortOption])}
                  </Typography>
                }
              />
            );
          })}
        </RadioGroup>
        <Typography className={header} variant='overline'>
          {translate('Title.FilterByCompletionStatus')}
        </Typography>
        {renderFilterCheckbox([EntryFilterOptions.Translated, EntryFilterOptions.Untranslated])}
        <Typography className={header} variant='overline'>
          {translate('Title.FilterByTranslationType')}
        </Typography>
        {renderFilterCheckbox([
          EntryFilterOptions.AutomaticTranslated,
          EntryFilterOptions.UserTranslated,
        ])}
        <Grid className={tooltipContainer} direction='row'>
          <Typography className={header} variant='overline'>
            {translate('Title.FilterByRecency')}
          </Typography>
          <Tooltip
            arrow
            className={tooltip}
            title={translate('Message.RecencyInfo')}
            placement='bottom'>
            <InfoOutlinedIcon fontSize='small' />
          </Tooltip>
        </Grid>
        {renderFilterCheckbox([
          EntryFilterOptions.RecentlyAddedEntries,
          EntryFilterOptions.RecentlyModifiedTranslations,
        ])}
        <Grid container direction='row' justifyContent='flex-end'>
          <Button
            className={buttonContainer}
            color='primary'
            size='small'
            variant='text'
            onClick={handleCancelClicked}>
            {translate('Label.Cancel')}
          </Button>
          <Button
            className={buttonContainer}
            color='primary'
            size='small'
            variant='contained'
            onClick={clearAllFilters}>
            {translate('Label.ClearAll')}
          </Button>
          <Button
            className={buttonContainer}
            color='primaryBrand'
            size='small'
            variant='contained'
            onClick={handleApplyChangesClicked}>
            {translate('Label.ApplyChanges')}
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

// Adapts the string-specific enum-typed props to the shared, generic SorterAndFilter's
// string-typed API. The narrowing handlers are memoized so the shared component (and its
// children) receive stable references.
const StringSorterAndFilter: FunctionComponent<React.PropsWithChildren<SorterAndFilterProps>> = ({
  sortingOption,
  setSortingOption,
  filterOptions,
  setFilterOptions,
  onMenuToggled,
}) => {
  const handleSetSortingOption = useCallback(
    (option: string) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      setSortingOption(option as EntrySortingOptions);
    },
    [setSortingOption],
  );
  const handleSetFilterOptions = useCallback(
    (options: string[]) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      setFilterOptions(options as EntryFilterOptions[]);
    },
    [setFilterOptions],
  );

  return (
    <SharedSorterAndFilter
      sortingOption={sortingOption}
      setSortingOption={handleSetSortingOption}
      filterOptions={filterOptions}
      setFilterOptions={handleSetFilterOptions}
      onMenuToggled={onMenuToggled}
    />
  );
};

// Gated by the `enableSharedTranslationListComponents` client setting: renders the shared,
// generic SorterAndFilter (fed pre-resolved labels + filter sections) when on, otherwise the
// original local implementation.
const SorterAndFilter: FunctionComponent<React.PropsWithChildren<SorterAndFilterProps>> = (
  props,
) => {
  const { settings } = useSettings();

  if (settings.enableSharedTranslationListComponents) {
    return <StringSorterAndFilter {...props} />;
  }

  return <LegacySorterAndFilter {...props} />;
};

export default SorterAndFilter;
