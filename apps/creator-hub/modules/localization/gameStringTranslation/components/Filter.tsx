import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { FiberManualRecordIcon, FilterListIcon, IconButton, Typography } from '@rbx/ui';
import useFilterStyles from './Filter.styles';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import EntryFilterOptions from '../enums/EntryFilterOptions';

export interface FilterProps {
  onFilterClicked: (event: React.MouseEvent<HTMLButtonElement>) => void;
  anchorElement: React.RefObject<HTMLButtonElement | null>;
  sortingOption: EntrySortingOptions;
  filterOptions: EntryFilterOptions[];
}

const Filter: FunctionComponent<React.PropsWithChildren<FilterProps>> = ({
  onFilterClicked,
  anchorElement,
  sortingOption,
  filterOptions,
}) => {
  const {
    classes: { text, filtered, notFiltered, circle },
  } = useFilterStyles();

  const numberOfSortsFiltersSelected = useMemo(() => {
    return filterOptions.length + (sortingOption === EntrySortingOptions.Default ? 0 : 1);
  }, [sortingOption, filterOptions]);

  const areFiltersApplied = useMemo(() => {
    return numberOfSortsFiltersSelected > 0;
  }, [numberOfSortsFiltersSelected]);

  return (
    <React.Fragment>
      <IconButton
        className={areFiltersApplied ? filtered : notFiltered}
        aria-label='filter'
        onClick={onFilterClicked}
        ref={anchorElement}
        size='large'>
        <FilterListIcon color='secondary' />
      </IconButton>
      {areFiltersApplied && (
        <Fragment>
          <FiberManualRecordIcon className={circle} color='primary' fontSize='small' />
          <Typography className={text} variant='tooltip'>
            {numberOfSortsFiltersSelected}
          </Typography>
        </Fragment>
      )}
    </React.Fragment>
  );
};

export default Filter;
