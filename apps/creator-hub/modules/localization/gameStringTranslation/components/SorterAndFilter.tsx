import React, { FunctionComponent, useState } from 'react';
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
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import EntryFilterOptions from '../enums/EntryFilterOptions';
import useSorterAndFilterStyles from './SorterAndFilter.styles';
import MultiCheckbox from './MultiCheckbox';
import { sortingOptionsLabelMap } from '../constants';
import getTranslation from '../utils/testFeedbackUtils';

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
  const { settings } = useSettings();
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
    const sortOption = (event.target as HTMLInputElement).value;
    setSelectedSortingOption(EntrySortingOptions[sortOption as keyof typeof EntrySortingOptions]);
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
    <React.Fragment>
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
        {settings.enableManualTranslationFeedback && (
          <React.Fragment>
            <Typography className={header} variant='overline'>
              {getTranslation(translate('Title.FilterByFeedback'), 'Filter By Feedback')}
            </Typography>
            <MultiCheckbox
              checkedValues={selectedFilterOptions}
              allowedValues={[EntryFilterOptions.FeedbackAvailable, EntryFilterOptions.NoFeedback]}
              setCheckedValues={setSelectedFilterOptions}
            />
          </React.Fragment>
        )}
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
    </React.Fragment>
  );
};

export default SorterAndFilter;
