import type { FunctionComponent, ChangeEvent } from 'react';
import React, { Fragment, useState, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Tooltip,
  Typography,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  ReportProblemOutlinedIcon,
  SearchIcon,
  CloseIcon,
  Menu,
} from '@rbx/ui';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type EntryFilterOptions from '../enums/EntryFilterOptions';
import type EntrySortingOptions from '../enums/EntrySortingOptions';
import useEntryInformation from '../hooks/useEntryInformation';
import useEntrySorterAndSearcherStyles from './EntrySorterAndSearcher.styles';
import Filter from './Filter';
import SorterAndFilter from './SorterAndFilter';

export interface EntrySorterAndSearcherProps {
  sortingOption: EntrySortingOptions;
  filterOptions: EntryFilterOptions[];
  stringToSearch: string;
  onSort: (option: EntrySortingOptions) => void;
  onFilter: (filterOptions: EntryFilterOptions[]) => void;
  onSearch: (string: string) => void;
}

const EntrySorterAndSearcher: FunctionComponent<
  React.PropsWithChildren<EntrySorterAndSearcherProps>
> = ({ sortingOption, filterOptions, stringToSearch, onSort, onFilter, onSearch }) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: {
      sortAndSearch,
      searchBar,
      tooltipIconPadding,
      tooltipLabel,
      heading,
      loader,
      searchAdornment,
    },
  } = useEntrySorterAndSearcherStyles();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchButtonClicked, setIsSearchButtonClicked] = useState<boolean>(false);
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const { translate } = useTranslation();
  const loadingIncompleteWarning = translate('Message.LoadingIncomplete');
  const errorLoadingTableWarning = translate('Message.ErrorLoadingTable');
  const { percentageLoaded, fetchFullEntryTableError, isFetchingFullEntryTable } =
    useEntryInformation();

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleSearchBarClose = () => {
    onSearch('');
    setIsSearchButtonClicked(false);
  };

  const handleToggleSearchButton = () => {
    onSearch('');
    setIsSearchButtonClicked(!isSearchButtonClicked);
    const entrySearchTrackerClientRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.SearchTranslationEntryList,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.TranslationStringsTab,
      },
    };
    trackerClient.sendEvent(entrySearchTrackerClientRequest);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  const handleSelectFilterOptions = (options: EntryFilterOptions[]) => {
    onFilter(options);
  };

  const handleSelectSortingOption = (option: EntrySortingOptions) => {
    onSort(option);
  };

  return (
    <>
      <Grid className={sortAndSearch} container wrap='nowrap' alignItems='center'>
        <Grid container item justifyContent='flex-start'>
          <Typography className={heading} variant='captionHeader'>
            {translate('Label.Strings')}
          </Typography>
        </Grid>
        <Grid container direction='row' alignItems='center' justifyContent='flex-end'>
          {isFetchingFullEntryTable && (
            <Fragment>
              <CircularProgress className={loader} color='primary' size='2rem' />
              <Typography className={tooltipLabel} variant='captionHeader'>
                {`${percentageLoaded}%`}
              </Typography>
              <Tooltip
                className={tooltipIconPadding}
                title={loadingIncompleteWarning}
                arrow
                placement='bottom'>
                <ReportProblemOutlinedIcon fontSize='small' />
              </Tooltip>
            </Fragment>
          )}
          {!!fetchFullEntryTableError && !isFetchingFullEntryTable && (
            <Tooltip
              className={tooltipIconPadding}
              title={errorLoadingTableWarning}
              arrow
              placement='bottom'>
              <ReportProblemOutlinedIcon fontSize='small' />
            </Tooltip>
          )}
          <Filter
            onFilterClicked={handleToggleMenu}
            anchorElement={anchorButtonRef}
            sortingOption={sortingOption}
            filterOptions={filterOptions}
          />
          <IconButton
            aria-label='search'
            edge='end'
            onClick={handleToggleSearchButton}
            size='large'>
            <SearchIcon color='secondary' />
          </IconButton>
        </Grid>
      </Grid>
      {isSearchButtonClicked && (
        <Grid container className={searchBar} wrap='nowrap'>
          <Input
            fullWidth
            autoFocus
            value={stringToSearch}
            onChange={handleInputChange}
            startAdornment={
              <InputAdornment className={searchAdornment} position='end'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            }
          />
          <IconButton aria-label='close' onClick={handleSearchBarClose} size='large'>
            <CloseIcon color='secondary' />
          </IconButton>
        </Grid>
      )}
      <Menu anchorEl={anchorButtonRef.current} open={isMenuOpen} onClose={handleMenuClose}>
        <SorterAndFilter
          sortingOption={sortingOption}
          setSortingOption={handleSelectSortingOption}
          filterOptions={filterOptions}
          setFilterOptions={handleSelectFilterOptions}
          onMenuToggled={setIsMenuOpen}
        />
      </Menu>
    </>
  );
};
export default EntrySorterAndSearcher;
