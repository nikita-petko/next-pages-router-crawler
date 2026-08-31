import type { ReactElement, ReactNode } from 'react';
import React, { useRef, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  IconButton,
  Pagination,
  Typography,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  CheckIcon,
  ScheduleIcon,
  Grid,
  List,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { entryListPageSize } from '../../constants';
import useEntryListStyle from './EntryList.styles';

export interface BaseEntryBriefInfo {
  identifier: string;
  isTranslated: boolean;
}

export interface EntryListProps<TEntry extends BaseEntryBriefInfo> {
  entries: TEntry[];
  isUpdating: boolean;
  activeEntryKey: string | null;
  onSelect: (activeEntryKey: string) => void;
  getPrimaryText: (entry: TEntry) => string;
  // Optional leading content rendered before the primary text (e.g. an image thumbnail avatar).
  renderItemStart?: (entry: TEntry) => ReactNode;
  // A value the caller derives from its sort/filter selection. When it changes, the list
  // resets to page 1. Keyed off the selection rather than `entries` identity so unrelated
  // re-renders (row selection, background data refreshes) don't snap back to page 1.
  resetPageKey: string;
}

const EntryList = <TEntry extends BaseEntryBriefInfo>({
  entries,
  isUpdating,
  activeEntryKey,
  onSelect,
  getPrimaryText,
  renderItemStart,
  resetPageKey,
}: EntryListProps<TEntry>): ReactElement => {
  const { translateWithNamespace } = useTranslation();
  const {
    classes: { buttonListItem, list, text, shimmerText },
  } = useEntryListStyle();
  const currentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to the first page whenever the sort/filter selection changes.
  // Adjusting state during render (instead of in an effect) is the React-recommended pattern.
  const [previousResetKey, setPreviousResetKey] = useState(resetPageKey);
  if (resetPageKey !== previousResetKey) {
    setPreviousResetKey(resetPageKey);
    setCurrentPage(1);
  }

  // calculate the total number of pages we have from the filteredEntryList
  const totalPages = Math.ceil(entries?.length / entryListPageSize);

  const currentList = useMemo(() => {
    // check list to see if the results are less than a full page
    // if so just return the entire list
    if (entries.length < entryListPageSize) {
      return entries;
    }
    // else, slice the list into pages of 20 entries each
    return entries.slice((currentPage - 1) * entryListPageSize, currentPage * entryListPageSize);
  }, [currentPage, entries]);

  const handleChangePage = (e: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <>
      <List className={list}>
        {currentList.map((entry) => {
          return (
            <ListItemButton
              className={buttonListItem}
              ref={entry.identifier === activeEntryKey ? currentRef : null}
              key={entry.identifier}
              id={entry.identifier}
              selected={entry.identifier === activeEntryKey}
              onClick={() => onSelect(entry.identifier)}>
              {renderItemStart?.(entry)}
              <ListItemText>
                <Typography className={isUpdating ? shimmerText : text} variant='largeLabel2'>
                  {getPrimaryText(entry)}
                </Typography>
              </ListItemText>
              <ListItemSecondaryAction>
                {entry.isTranslated ? (
                  <IconButton
                    aria-label={translateWithNamespace(
                      TranslationNamespace.GameStringTranslation,
                      'Label.Success',
                    )}
                    edge='end'
                    disabled
                    size='large'>
                    <CheckIcon fontSize='small' />
                  </IconButton>
                ) : (
                  <IconButton
                    aria-label={translateWithNamespace(
                      TranslationNamespace.GameStringTranslation,
                      'Label.Pending',
                    )}
                    edge='end'
                    disabled
                    size='large'>
                    <ScheduleIcon fontSize='small' />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItemButton>
          );
        })}
      </List>
      <Grid container justifyContent='center' alignItems='center'>
        <Pagination
          color='primary'
          count={totalPages}
          onChange={handleChangePage}
          page={currentPage}
        />
      </Grid>
    </>
  );
};

export default EntryList;
