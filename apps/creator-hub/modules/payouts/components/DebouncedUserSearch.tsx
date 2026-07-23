import React, { FunctionComponent, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  CircularProgress,
  SearchIcon,
  InputAdornment,
  CancelIcon,
  Grid,
  makeStyles,
  MenuItem,
  Menu,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { User, usersClient } from '@modules/clients';
// eslint-disable-next-line no-restricted-imports -- needed for user search
import { searchUsers } from '@modules/group/utils/groupUtils';
import { CreatorType } from '@modules/miscellaneous/common';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { DebouncedTextField } from '@modules/charts-generic';
import { SearchDebounceMilliseconds } from '../constants/payoutsConstants';
import FilteredUserType from '../interface/FilteredUserType';

const useDebouncedUserSearchStyles = makeStyles<{ width?: number }>()((theme, { width }) => ({
  pointerIcon: {
    cursor: 'pointer',
    color: theme.palette.content.muted,
  },

  searchResultList: {
    width,
    '& ul': {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },

  menuList: width ? { width, maxWidth: '100%' } : {},

  extendedLabelWidth: {
    width: '330px',
  },

  searchResultItem: {
    textOverflow: 'ellipsis',
    marginLeft: 0,
    marginRight: 0,
  },

  searchItemsContainer: {
    width: '100%',
    maxHeight: '260px',
    overflowY: 'auto',
  },

  divider: {
    borderBottom: `1px solid ${theme.palette.components.divider}`,
  },

  inputAdornments: {
    '&:first-child': {
      marginLeft: 8,
    },
    '& > *:not(:first-child)': {
      marginLeft: 10,
    },
  },

  searchResultLabel: {
    marginLeft: 44,
  },

  searchInput: {
    '& > div': {
      overflow: 'scroll',
    },
    '& .MuiOutlinedInput-root.Mui-disabled': {
      '&:hover fieldset': {
        borderColor: 'inherit',
      },
    },
  },
}));

export interface DebouncedUserSearchProps {
  value?: User;
  onSelect: (value?: User) => void;
  onFilter?: (results: Array<User>) => Promise<Array<FilteredUserType>>;
  textFieldLabel?: string;
  isDisabled?: boolean;
  textPlaceholder?: string;
  debounceTimeValue?: number;
}

const DebouncedUserSearch: FunctionComponent<DebouncedUserSearchProps> = ({
  value,
  onSelect,
  onFilter,
  textFieldLabel,
  isDisabled = false,
  textPlaceholder,
  debounceTimeValue = SearchDebounceMilliseconds,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    classes: {
      pointerIcon,
      searchResultList,
      searchResultItem,
      searchItemsContainer,
      menuList,
      extendedLabelWidth,
      inputAdornments,
      searchResultLabel,
      searchInput,
    },
    cx,
  } = useDebouncedUserSearchStyles({
    width: searchInputRef?.current?.offsetWidth ?? 0,
  });

  const { translate } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<FilteredUserType> | undefined>();
  const [error, setError] = useState<string | null>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const isSearchResultShown = useMemo(() => {
    return searchString.length > 0 && !!searchResults && searchResults?.length > 0;
  }, [searchResults, searchString.length]);

  const search = useCallback(async () => {
    if (searchString === '') {
      setSearchResults(undefined);
      return;
    }

    setLoading(true);

    try {
      const results = await searchUsers(searchString);

      try {
        // If a user id is directly searched, try getting by userid and adding it
        // to the front
        const searchUserId = parseInt(searchString, 10);
        if (!Number.isNaN(searchUserId)) {
          const searchUser = await usersClient.getUserById(searchUserId);
          results.unshift(searchUser);
        }
      } catch {
        // swallow this error - the parsed int might not be valid if part of
        // the username
      }

      if (onFilter) {
        const filteredResults = await onFilter(results);
        setSearchResults(filteredResults);
      } else {
        setSearchResults(
          results.map((result) => {
            return { user: result };
          }),
        );
      }

      setError(null);
    } catch {
      setSearchResults(undefined);
      setError(translate('Error.SearchingCreators'));
    }
    setLoading(false);
  }, [searchString, onFilter, translate]);

  const onDebouncedChange = useCallback(
    (input: string) => {
      setSearchString(input);

      // Clear selection when they start typing a new search
      if (value !== undefined && input.length > 0) {
        onSelect();
      }
    },
    [onSelect, value],
  );

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  const hasLabels = useMemo(
    () => searchResults?.some((res) => res.label && res.label.length > 0),
    [searchResults],
  );

  return (
    <Grid container wrap='wrap'>
      <DebouncedTextField
        fullWidth
        value={value ? (value?.displayName ?? value.name) : searchString}
        variant='outlined'
        size='small'
        onDebouncedChange={onDebouncedChange}
        onFocus={onFocus}
        onBlur={onBlur}
        debounceTime={debounceTimeValue}
        error={error !== null}
        label={textFieldLabel}
        placeholder={textPlaceholder}
        helperText={error}
        id='users-search'
        disabled={!!value || isDisabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start' className={inputAdornments}>
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='start'>
              {loading ? <CircularProgress color='secondary' size={20} /> : null}
              {((!loading && searchString.length > 0) || !!value) && (
                <CancelIcon
                  fontSize='small'
                  onClick={() => {
                    if (value) {
                      onSelect();
                    }

                    setSearchString('');
                  }}
                  className={pointerIcon}
                />
              )}
            </InputAdornment>
          ),
          ref: searchInputRef,
        }}
        className={searchInput}
      />

      <Menu
        className={cx(searchResultList, {
          [extendedLabelWidth]: hasLabels && (searchInputRef?.current?.offsetWidth ?? 0) < 330,
        })}
        anchorEl={searchInputRef.current}
        open={isSearchResultShown && isFocused && !value}
        disableAutoFocus
        onClose={() => {
          onDebouncedChange('');
          searchInputRef.current?.blur();
        }}
        MenuListProps={{
          classes: {
            root: cx(menuList, {
              [extendedLabelWidth]: hasLabels && (searchInputRef?.current?.offsetWidth ?? 0) < 330,
            }),
          },
        }}>
        <div className={searchItemsContainer}>
          {searchResults?.map(({ user, disabled, label }) => {
            return (
              <MenuItem
                disabled={disabled}
                onClick={() => {
                  onSelect(user);
                  onDebouncedChange('');
                }}
                key={`searchResult-${user.id}`}
                className={searchResultItem}>
                <Grid key={user.id} container wrap='wrap'>
                  <ThumbnailWithNames
                    target={user}
                    targetType={CreatorType.User}
                    variant='compact'
                    disableLink
                    disabled={disabled}
                  />

                  {label && (
                    <Typography
                      className={searchResultLabel}
                      variant='captionBody'
                      align='left'
                      color='error'>
                      {label}
                    </Typography>
                  )}
                </Grid>
              </MenuItem>
            );
          })}
        </div>
      </Menu>
    </Grid>
  );
};

export default DebouncedUserSearch;
