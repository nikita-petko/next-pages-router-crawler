import React, { FunctionComponent, useState, useMemo, useEffect } from 'react';
import { List, Grid, Button, CircularProgress } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import useEntryManagement from '../hooks/useEntryManagement';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import useGameStringsEntryListContainerStyles from './GameStringsEntryListContainer.styles';
import {
  filterEntryList,
  searchEntryList,
  sortEntryList,
} from '../implementations/sortAndFilterHelpers';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import EntrySorterAndSearcher from '../components/EntrySorterAndSearcher';
import EntryList from '../components/EntryList';
import EntryListStates from '../enums/EntryListStates';
import ListStateMessage from '../../translation/components/ListStateMessage';
import { EntryBriefInfo } from '../types';
import EntryFilterOptions from '../enums/EntryFilterOptions';

export interface GameStringsEntryListContainerProps {
  fullList: EntryBriefInfo[] | null;
  isLoadingEntryList: boolean;
  activeEntryKey: string | null;
  onSelectEntry: (activeEntryKey: string | null) => void;
  toggleAddEntryPanel: (show: boolean) => void;
  onAddEntryClick: () => void;
}

const GameStringsEntryListContainer: FunctionComponent<
  React.PropsWithChildren<GameStringsEntryListContainerProps>
> = ({
  fullList,
  activeEntryKey,
  isLoadingEntryList,
  onSelectEntry,
  toggleAddEntryPanel,
  onAddEntryClick,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: {
      list,
      elementsOnTop,
      addEntry,
      overlay,
      wrapper,
      disabledOverlay,
      loader,
      entrySide,
    },

    cx,
  } = useGameStringsEntryListContainerStyles();
  const { translate } = useTranslation();
  const [sortingOption, setSortingOption] = useState<EntrySortingOptions>(
    EntrySortingOptions.Default,
  );
  const [filterOptions, setFilterOptions] = useState<EntryFilterOptions[]>([]);
  const [stringToSearch, setStringToSearch] = useState<string>('');
  const [entryListState, setEntryListState] = useState<EntryListStates>(EntryListStates.Default);
  const [isUpdatingSortFilters, setIsUpdatingSortFilters] = useState<boolean>(false);
  const { sourceLanguageCode, activeTranslationTarget, isRoleAdmin } = useEntryManagementMetadata();
  const { fullEntryInfoMap } = useEntryManagement();

  const handleSortEntry = (_sortingOption: EntrySortingOptions) => {
    setIsUpdatingSortFilters(true);
    setSortingOption(_sortingOption);
    const entryFilterTrackerClientRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.FilterTranslationEntryList,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.TranslationStringsTab,
        EntrySortingOptions: _sortingOption,
      },
    };
    trackerClient.sendEvent(entryFilterTrackerClientRequest);
  };

  const handleFilterEntry = (_filterOptions: EntryFilterOptions[]) => {
    setIsUpdatingSortFilters(true);
    setFilterOptions(_filterOptions);
  };

  const handleSearchEntry = (_stringToSearch: string) => {
    setStringToSearch(_stringToSearch);
  };

  const handleSelectEntry = (_activeEntryKey: string) => {
    toggleAddEntryPanel(false);
    onSelectEntry(_activeEntryKey);
  };

  const filteredList: EntryBriefInfo[] | null = useMemo(() => {
    if (fullList === null) {
      return null;
    }
    if (fullList.length === 0) {
      onSelectEntry(null);
      setEntryListState(EntryListStates.EmptyList);
      return fullList;
    }

    let filteredEntryList: EntryBriefInfo[] = fullList;
    filteredEntryList = filterEntryList(filterOptions, fullList);

    filteredEntryList = searchEntryList(
      stringToSearch,
      filteredEntryList,
      fullEntryInfoMap,
      sourceLanguageCode,
      activeTranslationTarget?.languageCode ?? 'en',
    );

    filteredEntryList = sortEntryList(sortingOption, filteredEntryList, sourceLanguageCode);

    if (filteredEntryList.length === 0) {
      onSelectEntry(null);
      setEntryListState(EntryListStates.ResultNotFound);
      return filteredEntryList;
    }
    setEntryListState(EntryListStates.Default);
    if (!filteredEntryList.some((entry) => entry.identifier === activeEntryKey)) {
      onSelectEntry(filteredEntryList[0].identifier);
    }
    return filteredEntryList;
  }, [
    fullList,
    filterOptions,
    stringToSearch,
    fullEntryInfoMap,
    sourceLanguageCode,
    activeTranslationTarget?.languageCode,
    sortingOption,
    onSelectEntry,
    activeEntryKey,
  ]);

  // reset sort/filter options to default when selected translation language changes
  useEffect(() => {
    setFilterOptions([]);
    setSortingOption(EntrySortingOptions.Default);
  }, [activeTranslationTarget?.translationKey]);

  let content;
  if (isLoadingEntryList && !fullList) {
    content = (
      <List className={list}>
        <PageLoading />
      </List>
    );
  } else {
    content = (
      <div className={wrapper}>
        <List className={list}>
          {fullList && (
            <Grid className={elementsOnTop}>
              <EntrySorterAndSearcher
                sortingOption={sortingOption}
                filterOptions={filterOptions}
                stringToSearch={stringToSearch}
                onSearch={handleSearchEntry}
                onFilter={handleFilterEntry}
                onSort={handleSortEntry}
              />
              {isRoleAdmin && (
                <Grid className={addEntry}>
                  <Button
                    variant='contained'
                    fullWidth
                    size='small'
                    color='primary'
                    onClick={onAddEntryClick}>
                    {translate('Label.AddEntry')}
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
          <EntryList
            entries={filteredList ?? []}
            isUpdating={isLoadingEntryList}
            activeEntryKey={activeEntryKey}
            onSelect={handleSelectEntry}
            areSortsFiltersUpdated={isUpdatingSortFilters}
            onSortsFiltersUpdated={setIsUpdatingSortFilters}
          />
          {isLoadingEntryList && (
            <div className={cx(overlay, disabledOverlay)}>
              <Grid className={loader}>
                <CircularProgress />
              </Grid>
            </div>
          )}
          {!isLoadingEntryList && !fullList && (
            <ListStateMessage title={translate('Label.NoContent')}>
              {translate('Message.NoSourceContent')}
            </ListStateMessage>
          )}
          {entryListState === EntryListStates.ResultNotFound && (
            <ListStateMessage title={translate('Label.NoResults')}>
              {translate('Message.NoEntryFound')}
            </ListStateMessage>
          )}
        </List>
      </div>
    );
  }
  return <Grid className={entrySide}>{content}</Grid>;
};

export default GameStringsEntryListContainer;
