import type { FunctionComponent } from 'react';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { List, Grid, Button, CircularProgress } from '@rbx/ui';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import ListStateMessage from '../../translation/components/ListStateMessage';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import EntryList from '../components/EntryList';
import EntrySorterAndSearcher from '../components/EntrySorterAndSearcher';
import type EntryFilterOptions from '../enums/EntryFilterOptions';
import EntryListStates from '../enums/EntryListStates';
import EntrySortingOptions from '../enums/EntrySortingOptions';
import useEntryManagement from '../hooks/useEntryManagement';
import {
  filterEntryList,
  searchEntryList,
  sortEntryList,
} from '../implementations/sortAndFilterHelpers';
import type { EntryBriefInfo } from '../types';
import useGameStringsEntryListContainerStyles from './GameStringsEntryListContainer.styles';

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
  const { sourceLanguageCode, activeTranslationTarget, isRoleAdmin } = useEntryManagementMetadata();
  const { fullEntryInfoMap } = useEntryManagement();

  const handleSortEntry = (_sortingOption: EntrySortingOptions) => {
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
      return fullList;
    }

    let filteredEntryList: EntryBriefInfo[] = filterEntryList(filterOptions, fullList);

    filteredEntryList = searchEntryList(
      stringToSearch,
      filteredEntryList,
      fullEntryInfoMap,
      sourceLanguageCode,
      activeTranslationTarget?.languageCode ?? 'en',
    );

    filteredEntryList = sortEntryList(sortingOption, filteredEntryList, sourceLanguageCode);

    return filteredEntryList;
  }, [
    fullList,
    filterOptions,
    stringToSearch,
    fullEntryInfoMap,
    sourceLanguageCode,
    activeTranslationTarget?.languageCode,
    sortingOption,
  ]);

  // Derive the empty / no-results state during render instead of writing it from the memo above.
  let entryListState: EntryListStates = EntryListStates.Default;
  if (fullList !== null) {
    if (fullList.length === 0) {
      entryListState = EntryListStates.EmptyList;
    } else if (filteredList !== null && filteredList.length === 0) {
      entryListState = EntryListStates.ResultNotFound;
    }
  }

  // Keep the active selection in sync with the filtered list: clear it when nothing matches and
  // default to the first entry when the current selection drops out of the list. This updates
  // parent state, so it belongs in an effect rather than the render/memo path.
  useEffect(() => {
    if (filteredList === null) {
      return;
    }
    if (filteredList.length === 0) {
      if (activeEntryKey !== null) {
        onSelectEntry(null);
      }
      return;
    }
    if (!filteredList.some((entry) => entry.identifier === activeEntryKey)) {
      onSelectEntry(filteredList[0].identifier);
    }
  }, [filteredList, activeEntryKey, onSelectEntry]);

  // Reset sort/filter options to default when the selected translation language changes.
  // Adjusting state during render (instead of in an effect) is the React-recommended pattern.
  const [previousTranslationKey, setPreviousTranslationKey] = useState(
    activeTranslationTarget?.translationKey,
  );
  if (activeTranslationTarget?.translationKey !== previousTranslationKey) {
    setPreviousTranslationKey(activeTranslationTarget?.translationKey);
    setFilterOptions([]);
    setSortingOption(EntrySortingOptions.Default);
  }

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
            resetPageKey={`${sortingOption}:${[...filterOptions].sort().join(',')}`}
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
