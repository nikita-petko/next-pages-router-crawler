import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import type { TTranslationKey } from '@rbx/intl';
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
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  defaultSortingOption,
  filterLabelKeyByValue,
  filterSections,
  sortOptions,
} from '../../constants';
import MultiCheckbox from './MultiCheckbox';
import useSorterAndFilterStyles from './SorterAndFilter.styles';

export interface SorterAndFilterProps {
  sortingOption: string;
  setSortingOption: (newSortingOption: string) => void;
  filterOptions: string[];
  setFilterOptions: (filterOptions: string[]) => void;
  onMenuToggled: (isMenuOpen: boolean) => void;
}

const SorterAndFilter = ({
  sortingOption,
  setSortingOption,
  filterOptions,
  setFilterOptions,
  onMenuToggled,
}: SorterAndFilterProps): ReactElement => {
  const { translateWithNamespace } = useTranslation();
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
  const [selectedSortingOption, setSelectedSortingOption] = useState<string>(sortingOption);
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<string[]>(filterOptions);

  const translate = useCallback(
    (key: string): string =>
      translateWithNamespace(
        TranslationNamespace.GameStringTranslation,
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        key as TTranslationKey<typeof TranslationNamespace.GameStringTranslation>,
      ),
    [translateWithNamespace],
  );

  // Precomputed once from the module-level `filterSections` constant so each MultiCheckbox
  // receives a stable `allowedValues` reference across renders.
  const filterSectionsWithValues = useMemo(
    () =>
      filterSections.map((section) => ({
        ...section,
        allowedValues: section.options.map((option) => option.value),
      })),
    [],
  );

  const clearAllFilters = () => {
    setSelectedSortingOption(defaultSortingOption);
    setSelectedFilterOptions([]);
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const matchedOption = sortOptions.find((option) => option.value === event.target.value);
    if (matchedOption !== undefined) {
      setSelectedSortingOption(matchedOption.value);
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

  const getFilterLabel = useCallback(
    (value: string): string => translate(filterLabelKeyByValue[value] ?? value),
    [translate],
  );

  return (
    <>
      {' '}
      <Grid className={container} container direction='column'>
        <Typography className={header} variant='overline'>
          {translate('Title.SortBy')}
        </Typography>
        <RadioGroup className={radioGroup} id='sortOptions' onChange={handleRadioChange}>
          {sortOptions.map((sortOption) => {
            return (
              <FormControlLabel
                classes={{ labelPlacementStart: spacing }}
                key={sortOption.value}
                value={sortOption.value}
                labelPlacement='start'
                control={
                  <Radio
                    className={radioButtons}
                    size='small'
                    color='primary'
                    checked={selectedSortingOption === sortOption.value}
                    aria-label={translate(sortOption.labelKey)}
                  />
                }
                label={
                  <Typography variant='captionBody'>{translate(sortOption.labelKey)}</Typography>
                }
              />
            );
          })}
        </RadioGroup>
        {filterSectionsWithValues.map((section) => (
          <React.Fragment key={section.titleKey}>
            {section.tooltipKey !== undefined ? (
              <Grid className={tooltipContainer} direction='row'>
                <Typography className={header} variant='overline'>
                  {translate(section.titleKey)}
                </Typography>
                <Tooltip
                  arrow
                  className={tooltip}
                  title={translate(section.tooltipKey)}
                  placement='bottom'>
                  <InfoOutlinedIcon fontSize='small' />
                </Tooltip>
              </Grid>
            ) : (
              <Typography className={header} variant='overline'>
                {translate(section.titleKey)}
              </Typography>
            )}
            <MultiCheckbox
              checkedValues={selectedFilterOptions}
              allowedValues={section.allowedValues}
              getLabel={getFilterLabel}
              setCheckedValues={setSelectedFilterOptions}
            />
          </React.Fragment>
        ))}
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
