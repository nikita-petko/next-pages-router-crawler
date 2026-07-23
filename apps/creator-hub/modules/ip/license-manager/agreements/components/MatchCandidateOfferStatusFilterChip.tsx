import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, makeStyles, Menu, MenuItem, ExpandMoreIcon, Typography } from '@rbx/ui';

/**
 * Filters match candidates by whether an agreement already exists (drives match-drawer primary CTA).
 * Used on the Matches page status filter chip and filter drawer.
 */
export enum MatchCandidateOfferStatusFilter {
  All = 'All',
  NoOfferSent = 'NoOfferSent',
  HasAgreement = 'HasAgreement',
}

/** Horizontal gap between chip label icon and text (px). */
const CHIP_LABEL_ROW_GAP_PX = 4;

const useStyles = makeStyles()({
  chipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: CHIP_LABEL_ROW_GAP_PX,
    minWidth: 0,
  },
  chipLabelText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

const menuOptions: {
  value: MatchCandidateOfferStatusFilter | undefined;
  labelKey: string;
}[] = [
  { value: undefined, labelKey: 'Label.All' },
  { value: MatchCandidateOfferStatusFilter.NoOfferSent, labelKey: 'Label.NoOfferSent' },
  { value: MatchCandidateOfferStatusFilter.HasAgreement, labelKey: 'Label.HasAgreement' },
];

interface MatchCandidateOfferStatusChipLabelProps {
  selected: MatchCandidateOfferStatusFilter | undefined;
}

const MatchCandidateOfferStatusChipLabel = ({
  selected,
}: MatchCandidateOfferStatusChipLabelProps) => {
  const { translate } = useTranslation();
  let choiceLabel = translate('Label.All');
  if (selected === MatchCandidateOfferStatusFilter.NoOfferSent) {
    choiceLabel = translate('Label.NoOfferSent');
  } else if (selected === MatchCandidateOfferStatusFilter.HasAgreement) {
    choiceLabel = translate('Label.HasAgreement');
  }
  // Reuse Label.Status (same as the matches table column) so copy ships with existing i18n.
  // ICU compound keys are easy to mis-wire; explicit "Status: {selection}" avoids empty labels.
  return `${translate('Label.Status')}: ${choiceLabel}`;
};

interface Props {
  selected: MatchCandidateOfferStatusFilter | undefined;
  onFilterChange: (selected: MatchCandidateOfferStatusFilter | undefined) => void;
}

/**
 * Filter matches by agreement presence (no offer vs has agreement), aligned with match-drawer CTAs.
 */
const MatchCandidateOfferStatusFilterChip = ({ selected, onFilterChange }: Props) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleMenuItemClick = useCallback(
    (value: MatchCandidateOfferStatusFilter | undefined) => {
      onFilterChange(value);
      setAnchorEl(undefined);
    },
    [onFilterChange],
  );

  return (
    <>
      <Chip
        label={
          <div className={classes.chipLabel}>
            <span className={classes.chipLabelText}>
              <MatchCandidateOfferStatusChipLabel selected={selected} />
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
            minWidth: anchorEl?.offsetWidth,
          },
        }}>
        {menuOptions.map((option) => (
          <MenuItem
            key={option.labelKey}
            onClick={() => handleMenuItemClick(option.value)}
            dense
            selected={
              selected === option.value || (selected === undefined && option.value === undefined)
            }>
            <Typography>{translate(option.labelKey)}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default MatchCandidateOfferStatusFilterChip;
