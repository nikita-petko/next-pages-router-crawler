import React, { useCallback, useState } from 'react';
import { Button, Chip } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Menu, MenuItem } from '@rbx/ui';
import { API_TEAM_SIZE_LABELS } from '../../constants';
import type { TeamSize } from '../../types';
import styles from '../shared/Layout.module.css';

export type StudioFiltersState = {
  teamSize?: TeamSize;
  location?: string;
};

type FilterOption<T extends string | number> = {
  value: T;
  label: string;
};

const MENU_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'left' } as const;
const MENU_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'left' } as const;

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
    <>
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
          trailingIconName='icon-filled-chevron-large-down'
          className='pointer-events-none'
          tabIndex={-1}
        />
      </button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={MENU_ANCHOR_ORIGIN}
        transformOrigin={MENU_TRANSFORM_ORIGIN}>
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
    </>
  );
}

function isTeamSize(value: number): value is TeamSize {
  return Object.hasOwn(API_TEAM_SIZE_LABELS, value);
}

const teamSizeOptions: Array<FilterOption<TeamSize>> = Object.entries(API_TEAM_SIZE_LABELS).flatMap(
  ([value, label]) => {
    const numericValue = Number(value);
    return isTeamSize(numericValue) ? [{ value: numericValue, label }] : [];
  },
);

type StudioFiltersProps = {
  filters: StudioFiltersState;
  onChange: (filters: StudioFiltersState) => void;
  onReset: () => void;
};

export const StudioFilters: React.FC<StudioFiltersProps> = ({ filters, onChange, onReset }) => {
  const { translate } = useTranslation();
  const handleTeamSizeSelect = useCallback(
    (value: TeamSize | undefined) => onChange({ ...filters, teamSize: value }),
    [filters, onChange],
  );

  return (
    <div className='flex items-center gap-xsmall' data-testid='studio-filters'>
      <FilterMenuChip
        label={translate('Label.TeamSize')}
        allLabel='All team sizes'
        options={teamSizeOptions}
        selected={filters.teamSize}
        onSelect={handleTeamSizeSelect}
      />
      <Button
        variant='Utility'
        size='Medium'
        onClick={onReset}
        className={styles.filterResetButton}>
        <span className='text-body-medium'>{translate('Action.Reset')}</span>
      </Button>
    </div>
  );
};

export default StudioFilters;
