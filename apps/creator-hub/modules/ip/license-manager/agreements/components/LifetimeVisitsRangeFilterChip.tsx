import React, { useState } from 'react';
import { Chip, makeStyles, Menu, MenuItem, ExpandMoreIcon, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

const useStyles = makeStyles()({
  chipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
});

export enum LifetimeVisitsRange {
  All = 'All',
  Low = 'Low',
  High = 'High',
}

const lifetimeVisitsOptions = [
  { value: undefined, label: 'Label.All' },
  { value: LifetimeVisitsRange.Low, label: 'Label.LifetimeVisitsLow' },
  { value: LifetimeVisitsRange.High, label: 'Label.LifetimeVisitsHigh' },
];

interface LifetimeVisitsRangeChipLabelProps {
  selectedRange: LifetimeVisitsRange | undefined;
}

const LifetimeVisitsRangeChipLabel = ({ selectedRange }: LifetimeVisitsRangeChipLabelProps) => {
  const { translate } = useTranslation();
  if (!selectedRange) {
    return translate('Label.LifetimeVisitsRangeSelected', { range: translate('Label.All') });
  }
  switch (selectedRange) {
    case LifetimeVisitsRange.Low:
      return translate('Label.LifetimeVisitsRangeSelected', {
        range: translate('Label.LifetimeVisitsLow'),
      });
    case LifetimeVisitsRange.High:
      return translate('Label.LifetimeVisitsRangeSelected', {
        range: translate('Label.LifetimeVisitsHigh'),
      });
    default:
      return translate('Label.LifetimeVisitsRangeSelected', { range: translate('Label.All') });
  }
};

interface Props {
  selectedRange: LifetimeVisitsRange | undefined;
  onFilterChange: (selectedRange: LifetimeVisitsRange | undefined) => void;
}

/**
 * A chip-style filter dropdown to select the creator lifetime DAU range.
 */
const LifetimeVisitsRangeFilterChip = ({ selectedRange, onFilterChange }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleSelect = (range: LifetimeVisitsRange | undefined) => {
    onFilterChange(range);
    handleClose();
  };

  return (
    <React.Fragment>
      <Chip
        label={
          <div className={classes.chipLabel}>
            <span>
              <LifetimeVisitsRangeChipLabel selectedRange={selectedRange} />
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
        {lifetimeVisitsOptions.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => handleSelect(option.value as LifetimeVisitsRange | undefined)}
            dense
            selected={
              selectedRange === option.value || (!selectedRange && option.value === undefined)
            }>
            <Typography>{translate(option.label)}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
};

export default LifetimeVisitsRangeFilterChip;
