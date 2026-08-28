import type { FunctionComponent, ChangeEvent } from 'react';
import React, { useCallback, useState, useRef, useEffect } from 'react';
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
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type {
  EntrySorterAndSearcherRenderFilterArgs,
  EntrySorterAndSearcherRenderMenuArgs,
} from '../../translation/components/shared/EntrySorterAndSearcher';
import SharedEntrySorterAndSearcher from '../../translation/components/shared/EntrySorterAndSearcher';
import SharedFilter from '../../translation/components/shared/Filter';
import type EntryFilterOptions from '../enums/EntryFilterOptions';
import EntrySortingOptions from '../enums/EntrySortingOptions';
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

const sendSearchTrackerEvent = (
  trackerClient: ReturnType<typeof useEventTrackerProvider>['trackerClient'],
) => {
  const entrySearchTrackerClientRequest: TrackerClientRequest = {
    eventType: CreatorDashboardEventType.SearchTranslationEntryList,
    context: CreatorDashboardContext.Click,
    additionalProperties: {
      Source: CreatorDashboardSource.TranslationStringsTab,
    },
  };
  trackerClient.sendEvent(entrySearchTrackerClientRequest);
};

// Composes the shared, generic EntrySorterAndSearcher shell with the string-specific
// concerns (load-progress status, search analytics, the shared Filter, and SorterAndFilter).
const StringEntrySorterAndSearcher: FunctionComponent<
  React.PropsWithChildren<EntrySorterAndSearcherProps>
> = ({ sortingOption, filterOptions, stringToSearch, onSort, onFilter, onSearch }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const {
    classes: { tooltipIconPadding, tooltipLabel, loader },
  } = useEntrySorterAndSearcherStyles();
  const { percentageLoaded, fetchFullEntryTableError, isFetchingFullEntryTable } =
    useEntryInformation();

  const handleSearchToggled = useCallback(
    () => sendSearchTrackerEvent(trackerClient),
    [trackerClient],
  );

  const renderFilter = useCallback(
    ({ onFilterClicked, anchorElement }: EntrySorterAndSearcherRenderFilterArgs) => (
      <SharedFilter
        onFilterClicked={onFilterClicked}
        anchorElement={anchorElement}
        sortingOption={sortingOption}
        defaultSortingOption={EntrySortingOptions.Default}
        filterOptions={filterOptions}
      />
    ),
    [sortingOption, filterOptions],
  );

  const renderMenuContent = useCallback(
    ({ onMenuToggled }: EntrySorterAndSearcherRenderMenuArgs) => (
      <SorterAndFilter
        sortingOption={sortingOption}
        setSortingOption={onSort}
        filterOptions={filterOptions}
        setFilterOptions={onFilter}
        onMenuToggled={onMenuToggled}
      />
    ),
    [sortingOption, onSort, filterOptions, onFilter],
  );

  const statusContent = (
    <>
      {isFetchingFullEntryTable && (
        <>
          <CircularProgress className={loader} color='primary' size='2rem' />
          <Typography className={tooltipLabel} variant='captionHeader'>
            {`${percentageLoaded}%`}
          </Typography>
          <Tooltip
            className={tooltipIconPadding}
            title={translate('Message.LoadingIncomplete')}
            arrow
            placement='bottom'>
            <ReportProblemOutlinedIcon fontSize='small' />
          </Tooltip>
        </>
      )}
      {!!fetchFullEntryTableError && !isFetchingFullEntryTable && (
        <Tooltip
          className={tooltipIconPadding}
          title={translate('Message.ErrorLoadingTable')}
          arrow
          placement='bottom'>
          <ReportProblemOutlinedIcon fontSize='small' />
        </Tooltip>
      )}
    </>
  );

  return (
    <SharedEntrySorterAndSearcher
      heading={translate('Label.Strings')}
      stringToSearch={stringToSearch}
      onSearch={onSearch}
      statusContent={statusContent}
      onSearchToggled={handleSearchToggled}
      renderFilter={renderFilter}
      renderMenuContent={renderMenuContent}
    />
  );
};

const LegacyEntrySorterAndSearcher: FunctionComponent<
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
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { translate } = useTranslation();
  const { percentageLoaded, fetchFullEntryTableError, isFetchingFullEntryTable } =
    useEntryInformation();

  useEffect(() => {
    if (isSearchButtonClicked) {
      searchInputRef.current?.focus();
    }
  }, [isSearchButtonClicked]);

  const handleToggleMenu = () => {
    setMenuAnchorEl(anchorButtonRef.current);
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
    sendSearchTrackerEvent(trackerClient);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
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
            <>
              <CircularProgress className={loader} color='primary' size='2rem' />
              <Typography className={tooltipLabel} variant='captionHeader'>
                {`${percentageLoaded}%`}
              </Typography>
              <Tooltip
                className={tooltipIconPadding}
                title={translate('Message.LoadingIncomplete')}
                arrow
                placement='bottom'>
                <ReportProblemOutlinedIcon fontSize='small' />
              </Tooltip>
            </>
          )}
          {!!fetchFullEntryTableError && !isFetchingFullEntryTable && (
            <Tooltip
              className={tooltipIconPadding}
              title={translate('Message.ErrorLoadingTable')}
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
            inputRef={searchInputRef}
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
      <Menu anchorEl={menuAnchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        <SorterAndFilter
          sortingOption={sortingOption}
          setSortingOption={onSort}
          filterOptions={filterOptions}
          setFilterOptions={onFilter}
          onMenuToggled={setIsMenuOpen}
        />
      </Menu>
    </>
  );
};

// Gated by the `enableSharedTranslationListComponents` client setting: composes the shared,
// generic EntrySorterAndSearcher shell when on, otherwise the original local implementation.
const EntrySorterAndSearcher: FunctionComponent<
  React.PropsWithChildren<EntrySorterAndSearcherProps>
> = (props) => {
  const { settings } = useSettings();

  if (settings.enableSharedTranslationListComponents) {
    return <StringEntrySorterAndSearcher {...props} />;
  }

  return <LegacyEntrySorterAndSearcher {...props} />;
};

export default EntrySorterAndSearcher;
