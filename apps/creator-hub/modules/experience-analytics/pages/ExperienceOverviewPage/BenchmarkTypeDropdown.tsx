import React, { FC, useState, useCallback } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { makeStyles, Menu, MenuItem, Typography } from '@rbx/ui';
import { BenchmarkType } from '@rbx/client-universe-analytics-insights/v1';
import {
  useRAQIV2TranslationDependencies,
  BenchmarkGenre,
  benchmarkGenreToTranslationKey,
} from '@modules/experience-analytics-shared';
import { BenchmarkScorecardData } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { getBenchmarkTypeDisplayName } from '../../adapters/utils';

const useStyles = makeStyles()({
  menuPaper: {
    marginTop: '4px',
    width: 'auto',
  },
  button: {
    display: 'inline-block',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: 0,
    margin: 0,
    font: 'inherit',
    color: 'inherit',
  },
});

interface BenchmarkTypeDropdownProps {
  availableTypes: Set<BenchmarkType>;
  selectedType: BenchmarkType;
  onTypeChange: (type: BenchmarkType) => void;
  benchmarkScorecardData?: BenchmarkScorecardData;
}

const BenchmarkTypeDropdown: FC<BenchmarkTypeDropdownProps> = ({
  availableTypes,
  selectedType,
  onTypeChange,
  benchmarkScorecardData,
}) => {
  const { translate, locale } = useRAQIV2TranslationDependencies();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = !!anchorEl;
  const {
    classes: { menuPaper, button },
  } = useStyles();

  const getDisplayName = useCallback(
    (type: BenchmarkType) => {
      const baseName = getBenchmarkTypeDisplayName(type, translate);

      // If it's a genre benchmark, try to get the specific genre name
      if (type === BenchmarkType.Genre && benchmarkScorecardData) {
        const genreBenchmark = benchmarkScorecardData.benchmarkDataByType.get(BenchmarkType.Genre);
        const genre = genreBenchmark?.genre;

        if (genre && isValidEnumValue(BenchmarkGenre, genre)) {
          const genreTranslationKey = benchmarkGenreToTranslationKey[genre];
          if (genreTranslationKey) {
            const genreName = translate(genreTranslationKey);
            return `${genreName} ${baseName}`.toLocaleLowerCase(locale);
          }
        }
      }

      return baseName.toLocaleLowerCase(locale);
    },
    [benchmarkScorecardData, translate, locale],
  );

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleOptionSelect = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      const value = event.currentTarget.getAttribute('value');
      if (value) {
        onTypeChange(value as BenchmarkType);
        handleMenuClose();
      }
    },
    [onTypeChange, handleMenuClose],
  );

  if (availableTypes.size <= 1) {
    // Don't show dropdown if only one or no types available
    // This should never happen, but just in case
    return null;
  }

  return (
    <React.Fragment>
      <button
        onClick={handleButtonClick}
        className={button}
        type='button'
        aria-haspopup='listbox'
        {...(open && { 'aria-expanded': true })}
        aria-label='Select benchmark type'>
        <Chip
          variant='Standard'
          size='Medium'
          text={getDisplayName(selectedType)}
          isChecked={false}
          trailing='icon-filled-chevron-large-down'
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
          tabIndex={-1}
        />
      </button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            className: menuPaper,
            style: {
              minWidth: anchorEl?.offsetWidth ?? 'auto',
            },
          },
        }}>
        {Array.from(availableTypes).map((type) => (
          <MenuItem
            key={type}
            value={type}
            onClick={handleOptionSelect}
            selected={type === selectedType}
            disableRipple>
            <Typography variant='body2'>{getDisplayName(type)}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
};

export default BenchmarkTypeDropdown;
