import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Key } from '@rbx/core';
import { SearchIcon, TextField, Typography, Menu, MenuItem, InputAdornment } from '@rbx/ui';
import { SEARCH_DEBOUNCE_MILLISECONDS } from '../common/constants/searchDebounceInputConstants';
import SearchError from '../common/enums/SearchError';
import useDebounceFunction from '../hooks/useDebounceFunctionLegacy';
import useSearchDebounceInputStyles from './SearchDebounceInput.styles';

export interface SearchDebounceInputProps<T> {
  onSearch: (key: string) => void;
  onSearchResultClear: () => void;
  searchResultData: T[] | null;
  getDisplayResult: (item: T) => string;
  onSearchResultSelected: (selectedItem: T) => void;
  onSearchError: (err: SearchError) => void;
  errorMessage: string | null;
  searchResultPrefix?: string;
}

function SearchDebounceInput<T>({
  onSearch,
  onSearchResultClear,
  searchResultData,
  getDisplayResult,
  onSearchResultSelected,
  onSearchError,
  errorMessage,
  searchResultPrefix = '',
}: SearchDebounceInputProps<T>) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    classes: {
      searchErrorMsgContainer,
      searchErrorMsgTxt,
      searchResultList,
      searchResultItem,
      searchItemsContainer,
      divider,
      menuList,
    },

    cx,
  } = useSearchDebounceInputStyles({ width: searchInputRef?.current?.offsetWidth });
  const [searchString, setSearchString] = useState<string>('');
  const [debounceOnSearch, clearDebounceTimeout] = useDebounceFunction(
    onSearch,
    SEARCH_DEBOUNCE_MILLISECONDS,
  );
  const [isEnterPressed, setIsEnterPressed] = useState<boolean>(false);

  const isSearchResultShown = useMemo(() => {
    return searchResultData !== null && searchResultData.length > 0;
  }, [searchResultData]);

  const handleSearch = useCallback(
    (input: string, isEnterKeyPressed: boolean) => {
      setSearchString(input);
      setIsEnterPressed(isEnterKeyPressed);
      onSearchResultClear();
      const searchInputString = input.trim();
      if (searchInputString.length > 0) {
        if (isEnterKeyPressed) {
          clearDebounceTimeout();
          onSearch(searchInputString);
        } else {
          debounceOnSearch(searchInputString);
        }
      }
    },
    [onSearch, onSearchResultClear, clearDebounceTimeout, debounceOnSearch],
  );

  const handleSearchResultSelected = useCallback(
    (data: T) => {
      onSearchResultClear();
      onSearchResultSelected(data);
    },
    [onSearchResultSelected, onSearchResultClear],
  );

  useEffect(() => {
    if (searchResultData !== null && searchResultData.length === 0 && isEnterPressed) {
      onSearchError(SearchError.SearchNotFound);
    }
  }, [searchResultData, isEnterPressed, onSearchError]);

  return (
    <>
      <TextField
        label=''
        id='textFieldId'
        size='small'
        ref={searchInputRef}
        value={searchString}
        onChange={(event) => handleSearch(event.target.value, false)}
        onKeyDown={(event) =>
          event.key === Key.Enter && handleSearch((event.target as HTMLInputElement).value, true)
        }
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <div className={searchErrorMsgContainer}>
        <Typography className={searchErrorMsgTxt} variant='body2' align='left' color='error'>
          {errorMessage}
        </Typography>
      </div>
      <Menu
        className={searchResultList}
        anchorEl={searchInputRef.current}
        open={isSearchResultShown}
        onClose={onSearchResultClear}
        MenuListProps={{ classes: { root: menuList } }}
        disablePortal={false}>
        <div className={searchItemsContainer}>
          {searchResultData &&
            searchResultData.map((data: T, index) => {
              return (
                <MenuItem
                  onClick={() => handleSearchResultSelected(data)}
                  key={`searchResult-${getDisplayResult(data)}`}
                  className={cx({
                    [searchResultItem]: true,
                    [divider]: index !== searchResultData.length - 1,
                  })}>
                  {searchResultPrefix + getDisplayResult(data)}
                </MenuItem>
              );
            })}
        </div>
      </Menu>
    </>
  );
}

export default SearchDebounceInput;
