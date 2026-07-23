import React, { FunctionComponent, useState, useCallback } from 'react';
import { HighlightOffIcon, IconButton, InputAdornment, SearchIcon, TextField } from '@rbx/ui';
import { Key } from '@rbx/core';
import useClickableSearchIconStyles from './ClickableSearchIcon.styles';

export interface ClickableSearchIconProps {
  onSearch: (val: string) => void;
}

const ClickableSearchIcon: FunctionComponent<React.PropsWithChildren<ClickableSearchIconProps>> = ({
  onSearch,
}) => {
  const {
    classes: { searchBarShown },
  } = useClickableSearchIconStyles();
  const [isSearchButtonClicked, setIsSearchButtonClicked] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

  const handleSearchBarClose = useCallback(() => {
    setInputValue('');
    onSearch('');
    setIsSearchButtonClicked(false);
  }, [onSearch]);

  const handleSearch = useCallback(() => {
    setInputValue(inputValue);
    onSearch(inputValue);
  }, [inputValue, onSearch]);

  return (
    <div className={isSearchButtonClicked ? searchBarShown : ''}>
      {isSearchButtonClicked ? (
        <TextField
          id='textFieldId'
          label=''
          size='small'
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => event.key === Key.Enter && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  color='secondary'
                  aria-label='search-clear'
                  onClick={handleSearchBarClose}
                  size='small'>
                  <HighlightOffIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      ) : (
        <IconButton
          aria-label='search'
          color='secondary'
          onClick={() => setIsSearchButtonClicked(true)}
          size='large'>
          <SearchIcon />
        </IconButton>
      )}
    </div>
  );
};

export default ClickableSearchIcon;
