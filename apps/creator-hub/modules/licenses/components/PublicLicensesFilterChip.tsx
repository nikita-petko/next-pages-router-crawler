import React, { useCallback, useMemo, useState } from 'react';
import { Chip, ExpandMoreIcon, Menu, MenuItem, Typography } from '@rbx/ui';

const MENU_ANCHOR_ORIGIN = {
  vertical: 'bottom' as const,
  horizontal: 'left' as const,
};

const MENU_TRANSFORM_ORIGIN = {
  vertical: 'top' as const,
  horizontal: 'left' as const,
};

export interface PublicLicensesFilterOption<T extends string> {
  value: T;
  label: string;
}

interface PublicLicensesFilterChipProps<T extends string> {
  filterLabel: string;
  options: PublicLicensesFilterOption<T>[];
  selected: T;
  testId: string;
  onChange: (value: T) => void;
}

const PublicLicensesFilterChip = <T extends string>({
  filterLabel,
  options,
  selected,
  testId,
  onChange,
}: PublicLicensesFilterChipProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>();
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selected) ?? options[0],
    [options, selected],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(undefined);
  }, []);

  const handleSelect = (value: T) => {
    onChange(value);
    handleClose();
  };

  return (
    <>
      <Chip
        data-testid={testId}
        label={
          <div className='flex items-center gap-x-xsmall'>
            <span>
              {filterLabel}: {selectedOption.label}
            </span>
            <ExpandMoreIcon />
          </div>
        }
        onClick={(event) => setAnchorEl(event.currentTarget)}
        variant='filled'
        color='secondary'
      />
      <Menu
        anchorEl={anchorEl}
        open={anchorEl != null}
        onClose={handleClose}
        anchorOrigin={MENU_ANCHOR_ORIGIN}
        transformOrigin={MENU_TRANSFORM_ORIGIN}
        MenuListProps={{
          style: {
            minWidth: anchorEl?.offsetWidth,
          },
        }}>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            dense
            selected={selected === option.value}>
            <Typography>{option.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default PublicLicensesFilterChip;
