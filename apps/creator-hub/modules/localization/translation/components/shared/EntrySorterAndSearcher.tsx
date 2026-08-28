import type { ChangeEvent, FunctionComponent, MouseEvent, ReactNode, RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  IconButton,
  Input,
  InputAdornment,
  Menu,
  SearchIcon,
  CloseIcon,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEntrySorterAndSearcherStyles from './EntrySorterAndSearcher.styles';

export interface EntrySorterAndSearcherRenderFilterArgs {
  onFilterClicked: (event: MouseEvent<HTMLButtonElement>) => void;
  anchorElement: RefObject<HTMLButtonElement | null>;
}

export interface EntrySorterAndSearcherRenderMenuArgs {
  onMenuToggled: (isMenuOpen: boolean) => void;
}

export interface EntrySorterAndSearcherProps {
  heading: string;
  stringToSearch: string;
  onSearch: (value: string) => void;
  renderFilter: (args: EntrySorterAndSearcherRenderFilterArgs) => ReactNode;
  renderMenuContent: (args: EntrySorterAndSearcherRenderMenuArgs) => ReactNode;
  statusContent?: ReactNode;
  onSearchToggled?: () => void;
}

const EntrySorterAndSearcher: FunctionComponent<
  React.PropsWithChildren<EntrySorterAndSearcherProps>
> = ({
  heading,
  stringToSearch,
  onSearch,
  renderFilter,
  renderMenuContent,
  statusContent,
  onSearchToggled,
}) => {
  const { translateWithNamespace } = useTranslation();
  const {
    classes: { sortAndSearch, searchBar, heading: headingClass, searchAdornment },
  } = useEntrySorterAndSearcherStyles();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchButtonClicked, setIsSearchButtonClicked] = useState<boolean>(false);
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchButtonClicked) {
      searchInputRef.current?.focus();
    }
  }, [isSearchButtonClicked]);

  const handleToggleMenu = () => {
    setMenuAnchorEl(anchorButtonRef.current);
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleSearchBarClose = () => {
    onSearch('');
    setIsSearchButtonClicked(false);
  };

  const handleToggleSearchButton = () => {
    onSearch('');
    setIsSearchButtonClicked(!isSearchButtonClicked);
    onSearchToggled?.();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <>
      <Grid className={sortAndSearch} container wrap='nowrap' alignItems='center'>
        <Grid container item justifyContent='flex-start'>
          <Typography className={headingClass} variant='captionHeader'>
            {heading}
          </Typography>
        </Grid>
        <Grid container direction='row' alignItems='center' justifyContent='flex-end'>
          {statusContent}
          {renderFilter({ onFilterClicked: handleToggleMenu, anchorElement: anchorButtonRef })}
          <IconButton
            aria-label={translateWithNamespace(
              TranslationNamespace.GameStringTranslation,
              'Label.Search',
            )}
            edge='end'
            onClick={handleToggleSearchButton}
            size='large'>
            <SearchIcon color='secondary' />
          </IconButton>
        </Grid>
      </Grid>
      {isSearchButtonClicked && (
        <Grid container className={searchBar} wrap='nowrap'>
          <Input
            fullWidth
            inputRef={searchInputRef}
            value={stringToSearch}
            onChange={handleInputChange}
            startAdornment={
              <InputAdornment className={searchAdornment} position='end'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            }
          />
          <IconButton
            aria-label={translateWithNamespace(
              TranslationNamespace.GameStringTranslation,
              'Label.Close',
            )}
            onClick={handleSearchBarClose}
            size='large'>
            <CloseIcon color='secondary' />
          </IconButton>
        </Grid>
      )}
      <Menu anchorEl={menuAnchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        {renderMenuContent({ onMenuToggled: setIsMenuOpen })}
      </Menu>
    </>
  );
};

export default EntrySorterAndSearcher;
