import React, { useState } from 'react';
import { Button, Chip } from '@rbx/foundation-ui';
import { Menu, MenuItem } from '@rbx/ui';
import styles from '../shared/Layout.module.css';
import { API_TEAM_SIZE_LABELS } from '../../constants';
import type { TeamSize } from '../../types';

export type StudioFiltersState = {
  teamSize?: TeamSize;
  location?: string;
};

type FilterOption<T extends string | number> = {
  value: T;
  label: string;
};

type FilterMenuChipProps<T extends string | number> = {
  label: string;
  allLabel: string;
  options: Array<FilterOption<T>>;
  selected?: T;
  onSelect: (value: T | undefined) => void;
};

function FilterMenuChip<T extends string | number>({
  label,
  allLabel,
  options,
  selected,
  onSelect,
}: FilterMenuChipProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const selectedOption = options.find((option) => option.value === selected);
  const displayLabel = selectedOption?.label ?? allLabel;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value?: T) => {
    onSelect(value);
    handleClose();
  };

  return (
    <React.Fragment>
      <button
        type='button'
        className={styles.chipTrigger}
        onClick={handleOpen}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={label}>
        <Chip
          text={displayLabel}
          size='Medium'
          variant='Standard'
          isChecked={selected != null}
          trailing='icon-filled-chevron-large-down'
          className='pointer-events-none'
          tabIndex={-1}
        />
      </button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            style: {
              minWidth: anchorEl?.offsetWidth ?? 'auto',
            },
          },
        }}>
        <MenuItem selected={selected == null} onClick={() => handleSelect(undefined)}>
          {allLabel}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={String(option.value)}
            selected={option.value === selected}
            onClick={() => handleSelect(option.value)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
}

const teamSizeOptions: Array<FilterOption<TeamSize>> = Object.entries(API_TEAM_SIZE_LABELS).map(
  ([value, label]) => ({
    value: Number(value) as TeamSize,
    label,
  }),
);

type StudioFiltersProps = {
  filters: StudioFiltersState;
  onChange: (filters: StudioFiltersState) => void;
  onReset: () => void;
};

const locationOptions: Array<FilterOption<string>> = [
  { value: 'Remote', label: 'Remote' },
  { value: 'North America', label: 'North America' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Asia-Pacific', label: 'Asia-Pacific' },
];

export const StudioFilters: React.FC<StudioFiltersProps> = ({ filters, onChange, onReset }) => {
  return (
    <div className='flex items-center gap-xsmall flex-wrap' data-testid='studio-filters'>
      <FilterMenuChip
        label='Location'
        allLabel='All locations'
        options={locationOptions}
        selected={filters.location}
        onSelect={(value) => onChange({ ...filters, location: value })}
      />
      <FilterMenuChip
        label='Team size'
        allLabel='All sizes'
        options={teamSizeOptions}
        selected={filters.teamSize}
        onSelect={(value) => onChange({ ...filters, teamSize: value })}
      />
      <Button variant='Utility' size='Small' onClick={onReset}>
        Reset
      </Button>
    </div>
  );
};

export default StudioFilters;
