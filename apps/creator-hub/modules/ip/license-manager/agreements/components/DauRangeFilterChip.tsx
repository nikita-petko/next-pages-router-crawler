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

export enum DauRange {
  All = 'All',
  Low = 'Low',
  High = 'High',
}

const dauOptions = [
  { value: undefined, label: 'Label.All' },
  { value: DauRange.Low, label: 'Label.DauLow' },
  { value: DauRange.High, label: 'Label.DauHigh' },
];

interface DauRangeChipLabelProps {
  selectedRange: DauRange | undefined;
}

const DauRangeChipLabel = ({ selectedRange }: DauRangeChipLabelProps) => {
  const { translate } = useTranslation();
  if (!selectedRange) {
    return translate('Label.DauRangeSelected', { range: translate('Label.All') });
  }
  switch (selectedRange) {
    case DauRange.Low:
      return translate('Label.DauRangeSelected', { range: translate('Label.DauLow') });
    case DauRange.High:
      return translate('Label.DauRangeSelected', { range: translate('Label.DauHigh') });
    default:
      return translate('Label.DauRangeSelected', { range: translate('Label.All') });
  }
};

interface Props {
  selectedRange: DauRange | undefined;
  onFilterChange: (selectedRange: DauRange | undefined) => void;
}

/**
 * A chip-style filter dropdown to select DAU range.
 */
const DauRangeFilterChip = ({ selectedRange, onFilterChange }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleSelect = (range: DauRange | undefined) => {
    onFilterChange(range);
    handleClose();
  };

  return (
    <React.Fragment>
      <Chip
        label={
          <div className={classes.chipLabel}>
            <span>
              <DauRangeChipLabel selectedRange={selectedRange} />
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
        {dauOptions.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => handleSelect(option.value as DauRange | undefined)}
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

export default DauRangeFilterChip;
