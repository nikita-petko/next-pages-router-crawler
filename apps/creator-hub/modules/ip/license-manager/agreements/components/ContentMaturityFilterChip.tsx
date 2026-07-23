import React, { useState } from 'react';
import type { UniverseContentMaturity } from '@rbx/client-content-licensing-api/v1';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Chip, makeStyles, Menu, MenuItem, ExpandMoreIcon, Typography } from '@rbx/ui';
import { maturityRatingOptions } from '../../utils/maturityRating';

const useStyles = makeStyles()((theme) => ({
  chipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing(2),
    // Vertical gap between rows = paddingBottom + paddingTop of adjacent items = `spacing(1.5)` (e.g. 12px).
    paddingTop: theme.spacing(0.75),
    paddingBottom: theme.spacing(0.75),
    // Align row content with chip label inset (chip body padding is typically ~12px).
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
  },
  checkboxSlot: {
    display: 'inline-flex',
    flexShrink: 0,
  },
  menuItemText: {
    flex: 1,
    minWidth: 0,
  },
}));

interface ChipLabelProps {
  selectedRatings: UniverseContentMaturity[];
  translate: (key: string, params?: Record<string, string>) => string;
}

const ChipLabel = ({ selectedRatings, translate }: ChipLabelProps) => {
  if (selectedRatings.length === 0) {
    return translate('Label.ContentMaturitySelected', { rating: translate('Label.All') });
  }

  if (selectedRatings.length > 1) {
    // NOTE: if all rating are selected the current behavior is that N/A is still filtered out
    // so we'll show "Multiple" instead of "All" in this case too.
    return translate('Label.ContentMaturitySelected', { rating: translate('Label.Multiple') });
  }
  return translate('Label.ContentMaturitySelected', { rating: selectedRatings[0] });
};

interface Props {
  /**
   * Empty array means all
   */
  selectedRatings: UniverseContentMaturity[];
  onFilterChange: (selectedRatings: UniverseContentMaturity[]) => void;
}

/**
 * A chip-style filter dropdown to select content maturity ratings.
 */
const ContentMaturityFilterChip = ({ selectedRatings, onFilterChange }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleSelect = (rating: UniverseContentMaturity) => {
    let newSelectedRatings: UniverseContentMaturity[];
    if (selectedRatings.includes(rating)) {
      newSelectedRatings = selectedRatings.filter((r) => r !== rating);
    } else {
      newSelectedRatings = [...selectedRatings, rating];
    }
    onFilterChange(newSelectedRatings);
  };

  return (
    <>
      <Chip
        label={
          <div className={classes.chipLabel}>
            <span>
              <ChipLabel selectedRatings={selectedRatings} translate={translate} />
            </span>
            <ExpandMoreIcon />
          </div>
        }
        onClick={handleClick}
        variant='filled'
        color='secondary'
      />
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        MenuListProps={{
          style: {
            // ensure that the dropdown is at least as wide as the chip
            minWidth: anchorEl?.offsetWidth,
          },
        }}>
        {maturityRatingOptions.map((option) => (
          <MenuItem
            key={option.value}
            dense
            className={classes.menuItem}
            onClick={() => handleSelect(option.value)}>
            <span className={classes.checkboxSlot}>
              <Checkbox
                isChecked={selectedRatings.includes(option.value)}
                size='Small'
                placement='Start'
                aria-label={translate(option.label)}
              />
            </span>
            <Typography variant='body2' component='span' className={classes.menuItemText}>
              {translate(option.label)}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ContentMaturityFilterChip;
