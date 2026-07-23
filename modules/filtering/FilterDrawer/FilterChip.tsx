// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterChip.tsx

import { CancelIcon, Chip, IconButton, Tooltip } from '@rbx/ui';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import useFilterChipsStyles from './FilterChip.styles';
import { getText } from '../utils/filterStrings';

interface FilterChipProps {
  disabled?: boolean;
  label: string;
  onDelete: () => void;
}

const chipStyle = {
  maxWidth: 256,
};

const CloseIconForDisabledChip = ({ onDelete }: { onDelete: () => void }) => {
  const {
    classes: { closeIconForDisabledChip },
  } = useFilterChipsStyles();
  const onClickSpan = useCallback(() => {
    onDelete();
  }, [onDelete]);
  const label = getText('Action.DeleteFilter');
  return (
    <IconButton aria-label={label} className={closeIconForDisabledChip} onClick={onClickSpan}>
      <CancelIcon data-testid='disabled-chip-cancel-icon' />
    </IconButton>
  );
};

function FilterChip({ disabled, label, onDelete }: FilterChipProps) {
  const {
    classes: { tooltip },
  } = useFilterChipsStyles();
  const chipRef = useRef<HTMLDivElement>(null);
  const [tooltipLabel, setTooltipLabel] = useState('');

  useLayoutEffect(() => {
    if (chipRef.current?.clientWidth === chipStyle.maxWidth) {
      setTooltipLabel(label);
    }
  }, [label]);

  const deleteIconForDisabledChip = useMemo(() => {
    if (disabled) {
      return <CloseIconForDisabledChip onDelete={onDelete} />;
    }
    return null;
  }, [disabled, onDelete]);

  const body = (
    <Chip
      color='secondary'
      data-testid='filter-chip'
      disabled={disabled}
      label={label}
      onDelete={onDelete}
      ref={chipRef}
      style={chipStyle}
      variant='filled'
    />
  );

  if (disabled) {
    const unsupportedLabel = getText('Description.UnsupportedFilter');
    return (
      <Tooltip arrow data-testid='filter-chip-disabled-tooltip' title={unsupportedLabel}>
        <span style={{ position: 'relative' }}>
          {body}
          {deleteIconForDisabledChip}
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip arrow classes={{ tooltip }} data-testid='filter-chip-tooltip' title={tooltipLabel}>
      {body}
    </Tooltip>
  );
}

export default FilterChip;
