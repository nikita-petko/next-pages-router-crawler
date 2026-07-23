import React, { FunctionComponent, useState, useCallback, useRef, useEffect } from 'react';
import {
  CircularProgress,
  SearchIcon,
  InputAdornment,
  CancelIcon,
  Grid,
  makeStyles,
  Typography,
  Chip,
  Checkbox,
  Avatar,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { User, usersClient } from '@modules/clients';
// eslint-disable-next-line no-restricted-imports -- needed for user search
import { searchUsers } from '@modules/group/utils/groupUtils';
import { CreatorType } from '@modules/miscellaneous/common';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { DebouncedTextField } from '@modules/charts-generic';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { SearchDebounceMilliseconds } from '../constants/payoutsConstants';
import FilteredUserType from '../interface/FilteredUserType';

const useDebouncedUserSelectorStyles = makeStyles()((theme) => ({
  pointerIcon: {
    cursor: 'pointer',
    color: theme.palette.content.muted,
  },

  inputAdornments: {
    '&:first-child': {
      marginLeft: 8,
    },
    '& > *:not(:first-child)': {
      marginLeft: 10,
    },
  },

  listContainer: {
    '& > *:not(:last-child)': {
      paddingBottom: 8,
    },
    maxHeight: 480,
    overflowY: 'scroll',
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },

  thumbnailContainer: {
    margin: '8px 0px 8px 0px',
  },

  checkboxContainer: {
    marginRight: 16,
    flexBasis: 0,
  },

  chipContainer: {
    margin: '24px 4px 4px 0px',
    flexShrink: 0,
  },

  resultsLabel: {
    marginTop: 24,
  },
}));

export interface DebouncedUserSelectorProps {
  value?: User[];
  onChange?: (value: User[]) => void;
  onFilter?: (results: Array<User>) => Promise<Array<FilteredUserType>>;
  multiselect?: boolean;
  renderEndAdornment?: (user: User) => React.ReactNode;
  altHelperText?: string;
}

const DebouncedUserSelector: FunctionComponent<DebouncedUserSelectorProps> = ({
  value,
  onChange,
  onFilter,
  multiselect,
  renderEndAdornment,
  altHelperText,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    classes: {
      pointerIcon,
      inputAdornments,
      listContainer,
      thumbnailContainer,
      checkboxContainer,
      chipContainer,
      resultsLabel,
    },
  } = useDebouncedUserSelectorStyles();

  const { translate } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<FilteredUserType> | undefined>();
  const [error, setError] = useState<string | null>(null);

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

  const onDebouncedChange = useCallback((input: string) => {
    setSearchString(input);
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <React.Fragment>
      <DebouncedTextField
        fullWidth
        value={searchString}
        size='small'
        onDebouncedChange={onDebouncedChange}
        debounceTime={SearchDebounceMilliseconds}
        error={error !== null}
        label={translate('Label.Search')}
        helperText={error !== null ? error : altHelperText}
        id='users-selector'
        disabled={value !== undefined && value.length >= 20}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start' className={inputAdornments}>
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='start'>
              {loading ? <CircularProgress color='secondary' size={20} /> : null}
              {!loading && searchString.length > 0 && (
                <CancelIcon
                  fontSize='small'
                  onClick={() => setSearchString('')}
                  className={pointerIcon}
                />
              )}
            </InputAdornment>
          ),

          ref: searchInputRef,
        }}
      />

      <Grid container className={listContainer}>
        {multiselect && (
          <Grid container>
            {value?.map((user) => (
              <Chip
                key={user.id}
                label={user.name}
                color='secondary'
                size='medium'
                variant='outlined'
                onDelete={() => {
                  if (!onChange) {
                    return;
                  }

                  onChange(value.filter((u) => u.id !== user.id));
                }}
                className={chipContainer}
                avatar={
                  user?.id ? (
                    <Avatar variant='rounded' alt='avatar'>
                      <Thumbnail2d
                        targetId={user.id}
                        type={ThumbnailTypes.avatarHeadshot}
                        alt='thumbnail'
                        returnPolicy={ReturnPolicy.PlaceHolder}
                        includeBackground={false}
                      />
                    </Avatar>
                  ) : undefined
                }
              />
            ))}
          </Grid>
        )}

        {searchResults === undefined || searchResults.length === 0 ? (
          <Grid container justifyContent='center' className={resultsLabel}>
            {!loading && (
              <Typography variant='caption' color='disabled'>
                {searchString.length === 0
                  ? translate('Label.EnterSearch')
                  : translate('Label.NoResults')}
              </Typography>
            )}
          </Grid>
        ) : (
          <Grid container>
            {searchResults?.map(({ user, disabled, label }) => (
              <Grid
                key={user.id}
                container
                wrap='nowrap'
                alignItems='center'
                justifyContent='space-between'>
                <Grid
                  container
                  justifyContent='flex-start'
                  className={thumbnailContainer}
                  wrap='nowrap'>
                  {multiselect && (
                    <Grid container alignItems='center' className={checkboxContainer}>
                      <Checkbox
                        color='secondary'
                        size='medium'
                        disabled={disabled}
                        checked={
                          user.id !== undefined &&
                          value?.find((u) => u.id === user.id) !== undefined
                        }
                        onClick={(event) => {
                          if (!onChange) {
                            return;
                          }

                          if ((event.target as HTMLInputElement).checked) {
                            onChange([...(value ?? []), user]);
                          } else {
                            const removedUserList = (value ?? []).filter((u) => u.id !== user.id);
                            onChange(removedUserList);
                          }
                        }}
                      />
                    </Grid>
                  )}

                  <Grid container wrap='wrap'>
                    <ThumbnailWithNames
                      target={user}
                      targetType={CreatorType.User}
                      disabled={disabled}
                      disableLink
                    />

                    {label && (
                      <Grid container>
                        <Typography variant='captionBody' align='left' color='error'>
                          {label}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                {renderEndAdornment && (
                  <Grid item justifyContent='flex-end'>
                    {renderEndAdornment(user)}
                  </Grid>
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default DebouncedUserSelector;
