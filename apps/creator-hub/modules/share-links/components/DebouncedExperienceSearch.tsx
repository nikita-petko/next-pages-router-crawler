import { FunctionComponent, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  CircularProgress,
  InputAdornment,
  CancelIcon,
  Grid,
  makeStyles,
  MenuItem,
  Menu,
  Typography,
  ArrowDropDownIcon,
  ArrowDropUpIcon,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { universesClient, V1SearchUniversesRequest } from '@modules/clients';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { DebouncedTextField } from '@modules/charts-generic';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { SearchCreatorType, SearchSortParameter, Surface } from '@rbx/clients/universesApi';
import { SortOrder } from '@rbx/core';
import FilteredExperienceType from '../interface/FilteredExperienceType';
import { SearchDebounceMilliseconds } from '../constants/shareLinkConstants';

const useDebouncedExperienceSearchStyles = makeStyles<{ width?: number }>()((theme, { width }) => ({
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

export interface DebouncedExperienceSearchProps {
  value?: TExperience;
  onSelect: (value?: TExperience) => void;
  onFilter?: (results: Array<TExperience>) => Promise<Array<FilteredExperienceType>>;
  textFieldLabel?: string;
  isDisabled?: boolean;
  textPlaceholder?: string;
  debounceTimeValue?: number;
  required?: boolean;
}

const DebouncedExperienceSearch: FunctionComponent<DebouncedExperienceSearchProps> = ({
  value,
  onSelect,
  onFilter,
  textFieldLabel,
  isDisabled = false,
  textPlaceholder,
  debounceTimeValue = SearchDebounceMilliseconds,
  required = false,
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
      searchResultLabel,
      searchInput,
    },
    cx,
  } = useDebouncedExperienceSearchStyles({
    width: searchInputRef?.current?.offsetWidth ?? 0,
  });

  const { translate } = useTranslation();

  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const isGroup = useMemo(() => (currentGroup?.id ?? 0) !== 0, [currentGroup]);

  const [loading, setLoading] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<FilteredExperienceType> | undefined>();
  const [error, setError] = useState<string | null>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const isSearchResultShown = useMemo(() => {
    return searchResults !== undefined && searchResults?.length > 0;
  }, [searchResults]);

  const search = useCallback(async () => {
    setLoading(true);

    try {
      const creatorType = isGroup ? SearchCreatorType.Group : SearchCreatorType.User;
      const creatorTargetId = isGroup ? currentGroup?.id : user?.id;

      const searchRequest: V1SearchUniversesRequest = {
        search: searchString,
        creatorType,
        creatorTargetId,
        isArchived: false,
        isPublic: undefined,
        sortOrder: SortOrder.Desc,
        sortParam: SearchSortParameter.LastUpdated,
        surface: Surface.CreatorHubShareLinks,
        pageSize: 25,
      };

      const results = await universesClient.searchUniverses(searchRequest);
      const resultExperiences: TExperience[] =
        results?.data
          ?.filter((result) => result.id !== undefined)
          .map((result) => {
            return {
              id: result.id ?? 0, // Above filter ensures this is never undefined
              name: result.name ?? undefined,
              description: result.description ?? undefined,
              creatorType: result.creatorType ?? undefined,
              creatorTargetId: result.creatorTargetId ?? undefined,
              rootPlaceId: result.rootPlaceId ?? undefined,
            };
          }) ?? [];

      if (onFilter) {
        const filteredResults = await onFilter(resultExperiences);
        setSearchResults(filteredResults);
      } else {
        setSearchResults(
          resultExperiences.map((result) => {
            return { experience: result };
          }),
        );
      }

      setError(null);
    } catch {
      setSearchResults(undefined);
      setError(translate('Error.SearchingExperiences'));
    }
    setLoading(false);
  }, [isGroup, currentGroup?.id, user?.id, searchString, onFilter, translate]);

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
  }, [setIsFocused]);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, [setIsFocused]);

  useEffect(() => {
    search();
  }, [search]);

  const hasLabels = useMemo(
    () => searchResults?.some((res) => res.label && res.label.length > 0),
    [searchResults],
  );

  const getInputEndAdornment = useCallback(() => {
    if (loading) {
      return <CircularProgress color='secondary' size={20} />;
    }

    if (searchString.length > 0 || !!value)
      return (
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
      );

    if (isFocused) {
      return <ArrowDropDownIcon fontSize='small' className={pointerIcon} />;
    }

    if (!isFocused) {
      return <ArrowDropUpIcon fontSize='small' className={pointerIcon} />;
    }

    return undefined;
  }, [isFocused, loading, onSelect, pointerIcon, searchString.length, value]);

  return (
    <Grid container wrap='wrap'>
      <DebouncedTextField
        fullWidth
        value={value ? value.name : (searchString ?? '')}
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
        id='experience-search'
        disabled={!!value || isDisabled}
        InputProps={{
          endAdornment: <InputAdornment position='start'>{getInputEndAdornment()}</InputAdornment>,
          ref: searchInputRef,
        }}
        className={searchInput}
        required={required}
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
          onBlur();
        }}
        MenuListProps={{
          classes: {
            root: cx(menuList, {
              [extendedLabelWidth]: hasLabels && (searchInputRef?.current?.offsetWidth ?? 0) < 330,
            }),
          },
        }}>
        <div className={searchItemsContainer}>
          {searchResults?.map(({ experience, disabled, label }) => {
            return (
              <MenuItem
                disabled={disabled}
                onClick={() => {
                  onSelect(experience);
                  onDebouncedChange('');
                }}
                key={`searchResult-${experience.id}`}
                className={searchResultItem}>
                <Grid key={experience.id} container wrap='wrap'>
                  <ThumbnailWithNames
                    target={experience}
                    targetType='Experience'
                    variant='compact'
                    disableLink
                    disabled={disabled}
                    hideThumbnail
                    hideSecondaryLabel
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

export default DebouncedExperienceSearch;
