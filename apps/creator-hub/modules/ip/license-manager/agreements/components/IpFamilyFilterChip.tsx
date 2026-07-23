import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Chip,
  makeStyles,
  Menu,
  MenuItem,
  Typography,
  ExpandMoreIcon,
  CircularProgress,
} from '@rbx/ui';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';

const useStyles = makeStyles()({
  chipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: 16,
  },
  errorContainer: {
    padding: 16,
  },
});

interface Props {
  selectedIpFamilyId: string | undefined;
  onFilterChange: (selectedId: string | undefined) => void;
}

/**
 * A chip-style filter dropdown to select an ip family.
 */
const IpFamilyFilterChip = ({ selectedIpFamilyId, onFilterChange }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const { data, isLoading, error } = useIpFamiliesQuery();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleSelect = (id: string | undefined) => {
    onFilterChange(id);
    handleClose();
  };

  const ipFamilies = data?.ipFamilies || [];

  let chipLabel: React.ReactNode = '';

  if (!selectedIpFamilyId) {
    chipLabel = translate('Label.IpFamilySelected', { family: translate('Label.All') });
  } else if (isLoading) {
    chipLabel = <CircularProgress color='secondary' size={12} />;
  } else if (error) {
    chipLabel = translate('Error.LoadingData');
  } else {
    chipLabel = translate('Label.IpFamilySelected', {
      family:
        ipFamilies.find((family) => family.id === selectedIpFamilyId)?.name ||
        translate('Label.Unknown'),
    });
  }

  let menuContent = null;
  if (isLoading) {
    menuContent = (
      <div className={classes.loadingContainer}>
        <CircularProgress size={24} color='secondary' />
      </div>
    );
  } else if (error) {
    menuContent = (
      <div className={classes.errorContainer}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </div>
    );
  } else {
    menuContent = (
      <div>
        <MenuItem onClick={() => handleSelect(undefined)} dense selected={!selectedIpFamilyId}>
          <Typography>{translate('Label.All')}</Typography>
        </MenuItem>
        {ipFamilies.map((family) => (
          <MenuItem
            key={family.id}
            onClick={() => handleSelect(family.id || '')}
            dense
            selected={family.id === selectedIpFamilyId}>
            <Typography>{family.name}</Typography>
          </MenuItem>
        ))}
      </div>
    );
  }

  return (
    <>
      <Chip
        label={
          <div className={classes.chipLabel}>
            <span>{chipLabel}</span>
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
        {menuContent}
      </Menu>
    </>
  );
};

export default IpFamilyFilterChip;
