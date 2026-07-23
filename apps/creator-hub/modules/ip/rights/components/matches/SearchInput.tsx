import React, { useState } from 'react';
import {
  Autocomplete,
  Button,
  Grid,
  TextField,
  SearchIcon,
  InputAdornment,
  Typography,
  IconButton,
  DeleteIcon,
  CircularProgress,
} from '@rbx/ui';

import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { SearchType } from './SearchEnums';
import ImageSearchButton from './ImageSearchButton';

interface SearchInputProps {
  searchType: SearchType;
  searchText: string;
  searchHistory: string[];
  onSearchTextChange: (text: string) => void;
  onSearchHistoryChange: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: () => void;
  image: Blob | undefined;
  onImageSelect: (img: File | undefined) => void;
  onImageDeselect: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const SearchInput = ({
  searchType,
  searchText,
  searchHistory,
  onSearchTextChange,
  onSearchHistoryChange,
  onSubmit,
  onImageSelect,
  onImageDeselect,
  image,
  isLoading,
  disabled,
}: SearchInputProps) => {
  // update history results only when requested, instead of showing up immediately after search.
  const [lazyHistory, setLazyHistory] = useState(searchHistory);
  const { ready, translate } = useTranslation();
  const {
    isFetched: isIXPFetched,
    params: { enableImageSearch },
  } = useIXPParameters(IXPLayers.RightsManager);
  const showImage = enableImageSearch;
  if (!ready || !isIXPFetched) {
    return null;
  }

  let inputStartAdornment = (
    <InputAdornment position='start'>
      <SearchIcon fontSize='small' />
    </InputAdornment>
  );

  if (isLoading) {
    inputStartAdornment = <CircularProgress />;
  } else if (searchType === SearchType.Image && image) {
    inputStartAdornment = (
      <img src={URL.createObjectURL(image)} alt='Selected Thumbnail' style={{ height: 50 }} />
    );
  }

  return (
    <Autocomplete
      disabled={disabled}
      fullWidth
      freeSolo
      disableClearable
      options={searchType === SearchType.Text ? lazyHistory : []}
      value={searchType === SearchType.Text ? searchText : ''}
      onInputChange={(_, value) => {
        onSearchTextChange(value);
        setLazyHistory(searchHistory);
      }}
      size='small'
      // we're using groupBy to implement a header
      groupBy={() => translate('Label.RecentSearches')}
      renderGroup={(params) => {
        const { group, children } = params;
        return (
          <ul style={{ padding: '0' }}>
            <Grid
              sx={{
                padding: '2px 14px 2px 14px',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'space-between',
              }}
              alignItems='center'>
              <Typography color='primary' sx={{ textTransform: 'uppercase' }}>
                {group}
              </Typography>
              <Button
                sx={{ verticalAlign: 'text-bottom' }}
                variant='text'
                onClick={() => {
                  onSearchHistoryChange([]);
                  setLazyHistory([]);
                }}>
                {translate('Action.Clear')}
              </Button>
            </Grid>
            {children}
          </ul>
        );
      }}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <Grid
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}>
              <Typography color='primary'>{option}</Typography>
              <IconButton
                aria-label='delete'
                onClick={(e) => {
                  // prevent the option from being selected due to click propagation
                  e.stopPropagation();
                  onSearchHistoryChange((prev) => {
                    return prev.filter((text) => text !== option);
                  });
                  setLazyHistory((prev) => {
                    return prev.filter((text) => text !== option);
                  });
                }}>
                <DeleteIcon fontSize='small' color='secondary' />
              </IconButton>
            </Grid>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Search'
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              onImageDeselect();
            }
            if (event.key === 'Enter') {
              onSubmit();
            }
          }}
          type='search'
          InputProps={{
            ...params.InputProps,
            startAdornment: inputStartAdornment,
            endAdornment: showImage && <ImageSearchButton onImageSelect={onImageSelect} />,
          }}
        />
      )}
    />
  );
};

export default withTranslation(SearchInput, [TranslationNamespace.RightsPortal]);
