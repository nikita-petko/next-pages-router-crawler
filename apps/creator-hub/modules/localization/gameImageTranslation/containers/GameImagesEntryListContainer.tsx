import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, List } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type EntryFilterOptions from '../../gameStringTranslation/enums/EntryFilterOptions';
import EntrySortingOptions from '../../gameStringTranslation/enums/EntrySortingOptions';
import ListStateMessage from '../../translation/components/ListStateMessage';
import EntryListStates from '../../translation/enums/EntryListStates';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ImageEntryList from '../components/ImageEntryList';
import ImageEntrySorterAndSearcher from '../components/ImageEntrySorterAndSearcher';
import useImageEntryManagement from '../hooks/useImageEntryManagement';
import {
  filterImageEntryList,
  searchImageEntryList,
  sortImageEntryList,
} from '../implementations/imageSortAndFilterHelpers';
import type { ImageEntryBriefInfo } from '../types';
import useGameImagesEntryListContainerStyles from './GameImagesEntryListContainer.styles';

// Stable empty-list reference so the `filteredList ?? …` fallback doesn't allocate a new array each
// render and invalidate EntryList's `useMemo([currentPage, entries])`.
const EMPTY_IMAGE_ENTRIES: ImageEntryBriefInfo[] = [];

export interface GameImagesEntryListContainerProps {
  fullList: ImageEntryBriefInfo[] | null;
  isLoadingEntryList: boolean;
  activeEntryKey: string | null;
  onSelectEntry: (identifier: string | null) => void;
}

const GameImagesEntryListContainer: FunctionComponent<
  React.PropsWithChildren<GameImagesEntryListContainerProps>
> = ({ fullList, activeEntryKey, isLoadingEntryList, onSelectEntry }) => {
  const {
    classes: { list, elementsOnTop, wrapper, entrySide },
  } = useGameImagesEntryListContainerStyles();
  const { translateWithNamespace } = useTranslation();
  const [sortingOption, setSortingOption] = useState<EntrySortingOptions>(
    EntrySortingOptions.Default,
  );
  const [filterOptions, setFilterOptions] = useState<EntryFilterOptions[]>([]);
  const [stringToSearch, setStringToSearch] = useState('');
  const { sourceLanguageCode, activeTranslationTarget } = useEntryManagementMetadata();
  const { fullEntryInfoMap } = useImageEntryManagement();

  const searchLocale = activeTranslationTarget?.languageCode ?? sourceLanguageCode ?? 'en';

  const filteredList: ImageEntryBriefInfo[] | null = useMemo(() => {
    if (fullList === null) {
      return null;
    }
    if (fullList.length === 0) {
      return fullList;
    }

    let filtered: ImageEntryBriefInfo[] = filterImageEntryList(filterOptions, fullList);
    filtered = searchImageEntryList(stringToSearch, filtered, fullEntryInfoMap, searchLocale);
    filtered = sortImageEntryList(sortingOption, filtered);

    return filtered;
  }, [fullList, filterOptions, stringToSearch, fullEntryInfoMap, searchLocale, sortingOption]);

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
  // default to the first entry when the current selection drops out. This writes parent state, so
  // it belongs in an effect rather than the render/memo path.
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

  // Reset sort/filter to default when the selected translation language changes.
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
  if (isLoadingEntryList && (fullList === null || fullList.length === 0)) {
    content = (
      <List className={list}>
        <PageLoading />
      </List>
    );
  } else {
    content = (
      <div className={wrapper}>
        <List className={list}>
          {fullList ? (
            <Grid className={elementsOnTop}>
              <ImageEntrySorterAndSearcher
                filterOptions={filterOptions}
                sortingOption={sortingOption}
                stringToSearch={stringToSearch}
                onFilter={setFilterOptions}
                onSearch={setStringToSearch}
                onSort={setSortingOption}
              />
            </Grid>
          ) : null}
          <ImageEntryList
            activeEntryKey={activeEntryKey}
            entries={filteredList ?? EMPTY_IMAGE_ENTRIES}
            isUpdating={isLoadingEntryList}
            onSelect={onSelectEntry}
            resetPageKey={`${sortingOption}:${[...filterOptions].sort().join(',')}:${stringToSearch}`}
          />
          {!isLoadingEntryList && (fullList === null || fullList.length === 0) ? (
            <ListStateMessage
              title={translateWithNamespace(
                TranslationNamespace.GameStringTranslation,
                'Label.NoContent',
              )}>
              {translateWithNamespace(
                TranslationNamespace.GameStringTranslation,
                'Message.NoSourceContent',
              )}
            </ListStateMessage>
          ) : null}
          {entryListState === EntryListStates.ResultNotFound ? (
            <ListStateMessage
              title={translateWithNamespace(
                TranslationNamespace.GameStringTranslation,
                'Label.NoResults',
              )}>
              {translateWithNamespace(
                TranslationNamespace.GameStringTranslation,
                'Message.NoEntryFound',
              )}
            </ListStateMessage>
          ) : null}
        </List>
      </div>
    );
  }

  return <Grid className={entrySide}>{content}</Grid>;
};

export default GameImagesEntryListContainer;
