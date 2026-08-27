import type { MouseEvent, ReactElement, RefObject } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { FiberManualRecordIcon, FilterListIcon, IconButton, Typography } from '@rbx/ui';
import useFilterStyles from './Filter.styles';

export interface FilterProps<TSortingOption, TFilterOption> {
  onFilterClicked: (event: MouseEvent<HTMLButtonElement>) => void;
  anchorElement: RefObject<HTMLButtonElement | null>;
  sortingOption: TSortingOption;
  defaultSortingOption: TSortingOption;
  filterOptions: TFilterOption[];
}

const Filter = <TSortingOption, TFilterOption>({
  onFilterClicked,
  anchorElement,
  sortingOption,
  defaultSortingOption,
  filterOptions,
}: FilterProps<TSortingOption, TFilterOption>): ReactElement => {
  const { translateWithNamespace } = useTranslation();
  const {
    classes: { text, filtered, notFiltered, circle },
  } = useFilterStyles();

  const numberOfSortsFiltersSelected =
    filterOptions.length + (sortingOption === defaultSortingOption ? 0 : 1);
  const areFiltersApplied = numberOfSortsFiltersSelected > 0;

  return (
    <>
      <IconButton
        className={areFiltersApplied ? filtered : notFiltered}
        aria-label={translateWithNamespace(
          'CreatorDashboard.GameStringTranslation',
          'Label.FilterBy',
        )}
        onClick={onFilterClicked}
        ref={anchorElement}
        size='large'>
        <FilterListIcon color='secondary' />
      </IconButton>
      {areFiltersApplied && (
        <>
          <FiberManualRecordIcon className={circle} color='primary' fontSize='small' />
          <Typography className={text} variant='tooltip'>
            {numberOfSortsFiltersSelected}
          </Typography>
        </>
      )}
    </>
  );
};

export default Filter;
