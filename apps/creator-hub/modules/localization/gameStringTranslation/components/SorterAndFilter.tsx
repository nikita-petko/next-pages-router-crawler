import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
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

const SorterAndFilter: FunctionComponent<React.PropsWithChildren<SorterAndFilterProps>> = ({
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
                key={sortOption as string}
                value={sortOption}
                labelPlacement='start'
                control={
                  <Radio
                    className={radioButtons}
                    size='small'
                    color='primary'
                    checked={selectedSortingOption === sortOption}
                    aria-label={translate(
                      sortingOptionsLabelMap[sortOption as EntrySortingOptions],
                    )}
                  />
                }
                label={
                  <Typography variant='captionBody'>
                    {translate(sortingOptionsLabelMap[sortOption as EntrySortingOptions])}
                  </Typography>
                }
              />
            );
          })}
        </RadioGroup>
        <Typography className={header} variant='overline'>
          {translate('Title.FilterByCompletionStatus')}
        </Typography>
        <MultiCheckbox
          checkedValues={selectedFilterOptions}
          allowedValues={[EntryFilterOptions.Translated, EntryFilterOptions.Untranslated]}
          setCheckedValues={setSelectedFilterOptions}
        />
        <Typography className={header} variant='overline'>
          {translate('Title.FilterByTranslationType')}
        </Typography>
        <MultiCheckbox
          checkedValues={selectedFilterOptions}
          allowedValues={[
            EntryFilterOptions.AutomaticTranslated,
            EntryFilterOptions.UserTranslated,
          ]}
          setCheckedValues={setSelectedFilterOptions}
        />
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
        <MultiCheckbox
          checkedValues={selectedFilterOptions}
          allowedValues={[
            EntryFilterOptions.RecentlyAddedEntries,
            EntryFilterOptions.RecentlyModifiedTranslations,
          ]}
          setCheckedValues={setSelectedFilterOptions}
        />
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

export default SorterAndFilter;
