import type { FunctionComponent } from 'react';
import React, { useRef, useMemo, useState, useEffect } from 'react';
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
import { entryListPageSize } from '../constants';
import type { EntryBriefInfo } from '../types';
import useEntryListStyle from './EntryList.styles';

export interface EntryListProps {
  entries: EntryBriefInfo[];
  isUpdating: boolean;
  activeEntryKey: string | null;
  onSelect: (activeEntryKey: string) => void;
  areSortsFiltersUpdated: boolean;
  onSortsFiltersUpdated: (isUpdating: boolean) => void;
}

const EntryList: FunctionComponent<React.PropsWithChildren<EntryListProps>> = ({
  entries,
  isUpdating,
  activeEntryKey,
  onSelect,
  areSortsFiltersUpdated,
  onSortsFiltersUpdated,
}) => {
  const {
    classes: { buttonListItem, list, text, shimmerText },
  } = useEntryListStyle();
  const currentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // calculate the total number of pages we have from the filteredEntryList
  const totalPages = useMemo(() => {
    return Math.ceil(entries?.length / entryListPageSize);
  }, [entries]);

  useEffect(() => {
    // resets page to 1 when new filters/sorts are applied
    if (areSortsFiltersUpdated) {
      setCurrentPage(1);
      onSortsFiltersUpdated(false);
    }
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-runs when areSortsFiltersUpdated changes; codeowners should triage
  }, [areSortsFiltersUpdated]);

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
              <ListItemText>
                <Typography className={isUpdating ? shimmerText : text} variant='largeLabel2'>
                  {entry.sourceText}
                </Typography>
              </ListItemText>
              <ListItemSecondaryAction>
                {entry.isTranslated ? (
                  <IconButton aria-label='success' edge='end' disabled size='large'>
                    <CheckIcon fontSize='small' />
                  </IconButton>
                ) : (
                  <IconButton aria-label='pending' edge='end' disabled size='large'>
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
