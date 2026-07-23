import React, { useState } from 'react';
import { Chip, makeStyles, Menu, MenuItem, ExpandMoreIcon, Checkbox, ListItemText } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { UniverseContentMaturity } from '@rbx/clients/contentLicensingApi/v1';
import { maturityRatingOptions } from '../../utils/maturityRating';

const useStyles = makeStyles()({
  chipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
});

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
    <React.Fragment>
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
          <MenuItem key={option.value} onClick={() => handleSelect(option.value)} dense>
            <Checkbox checked={selectedRatings.includes(option.value)} />
            <ListItemText primary={translate(option.label)} />
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
};

export default ContentMaturityFilterChip;
